const fornecedorController = {
  // Gerar pedido automático baseado em estoque baixo
  async gerarPedidoAutomatico(req, res) {
    try {
      const { fornecedorNome } = req.body;
      
      // Buscar produtos com estoque baixo do fornecedor
      const produtosBaixoEstoque = await Produto.find({
        $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] },
        'fornecedor.nome': fornecedorNome,
        ativo: true
      });
      
      if (produtosBaixoEstoque.length === 0) {
        return res.json({ message: 'Nenhum produto em estoque baixo para este fornecedor' });
      }
      
      const fornecedorInfo = produtosBaixoEstoque[0].fornecedor;
      
      const itens = await Promise.all(produtosBaixoEstoque.map(async produto => {
        const vendaMedia = await this.calcularVendaMedia(produto._id);
        const quantidadeSugerida = Math.max(
          produto.estoqueMaximo - produto.estoqueAtual,
          vendaMedia * 45 // 45 dias de estoque
        );
        
        return {
          produto: produto._id,
          codigoProduto: produto.codigo,
          descricao: produto.nome,
          quantidade: quantidadeSugerida,
          precoUnitario: produto.precoCusto || produto.precoVenda * 0.7,
          total: quantidadeSugerida * (produto.precoCusto || produto.precoVenda * 0.7)
        };
      }));
      
      const pedido = new PedidoFornecedor({
        fornecedor: {
          nome: fornecedorInfo.nome,
          contato: fornecedorInfo.contato,
          telefone: fornecedorInfo.telefone,
          email: fornecedorInfo.email
        },
        itens,
        valores: {
          subtotal: itens.reduce((sum, item) => sum + item.total, 0)
        },
        observacoes: 'Pedido gerado automaticamente baseado em estoque baixo',
        solicitante: req.user?.id
      });
      
      // Calcular total com frete estimado
      pedido.valores.frete = pedido.valores.subtotal * 0.05; // 5% de frete
      pedido.valores.total = pedido.valores.subtotal + pedido.valores.frete;
      
      await pedido.save();
      await pedido.populate('itens.produto', 'nome codigo');
      
      res.status(201).json({
        message: 'Pedido automático gerado com sucesso',
        pedido,
        resumo: {
          totalItens: itens.length,
          valorTotal: pedido.valores.total,
          prazoSugerido: '7-15 dias úteis'
        }
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  async calcularVendaMedia(produtoId, dias = 30) {
    // Implementar consulta no histórico de vendas
    // Por enquanto retorna valor simulado
    return Math.floor(Math.random() * 3) + 1;
  },
  
  // Listar pedidos pendentes
  async listarPedidos(req, res) {
    try {
      const { status, fornecedor } = req.query;
      
      const filtros = {};
      if (status) filtros.status = status;
      if (fornecedor) filtros['fornecedor.nome'] = { $regex: fornecedor, $options: 'i' };
      
      const pedidos = await PedidoFornecedor.find(filtros)
        .populate('itens.produto', 'nome codigo')
        .sort({ dataCriacao: -1 });
      
      res.json(pedidos);
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Confirmar recebimento de pedido
  async confirmarRecebimento(req, res) {
    try {
      const { id } = req.params;
      const { numeroNotaFiscal, observacoes } = req.body;
      
      const pedido = await PedidoFornecedor.findById(id).populate('itens.produto');
      
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      
      // Atualizar estoque dos produtos
      for (const item of pedido.itens) {
        await Produto.findByIdAndUpdate(
          item.produto._id,
          { 
            $inc: { estoqueAtual: item.quantidade },
            ultimaCompra: new Date()
          }
        );
      }
      
      // Atualizar status do pedido
      pedido.status = 'entregue';
      pedido.prazos.recebimento = new Date();
      pedido.numeroNotaFiscal = numeroNotaFiscal;
      if (observacoes) pedido.observacoes += ` | Recebimento: ${observacoes}`;
      
      await pedido.save();
      
      res.json({
        message: 'Recebimento confirmado e estoque atualizado',
        pedido: pedido.numero,
        itensAtualizados: pedido.itens.length
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};