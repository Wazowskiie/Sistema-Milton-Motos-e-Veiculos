const integracaoController = {
  // Fluxo: Venda de moto -> Agendamento primeira revisão
  async vendaMotoComRevisao(req, res) {
    try {
      const { 
        clienteId, 
        motoData, 
        valorVenda, 
        kmAtual, 
        dataProximaRevisao 
      } = req.body;
      
      // 1. Atualizar dados do cliente com a nova moto
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      // Adicionar moto ao cliente
      cliente.motos.push({
        ...motoData,
        kmAtual,
        dataCompra: new Date(),
        valorCompra: valorVenda
      });
      
      // Adicionar ao histórico de serviços com próxima revisão
      cliente.historicoServicos.push({
        tipo: 'venda',
        descricao: `Venda de ${motoData.marca} ${motoData.modelo}`,
        valor: valorVenda,
        moto: motoData.placa,
        km: kmAtual,
        proximaRevisao: new Date(dataProximaRevisao)
      });
      
      // Adicionar pontos de fidelidade (1 ponto por R$ gasto)
      cliente.pontosAcumulados += Math.floor(valorVenda / 10);
      
      await cliente.save();
      
      // 2. Criar lembrete de revisão
      const ordemRevisao = new OrdemServico({
        cliente: clienteId,
        moto: {
          marca: motoData.marca,
          modelo: motoData.modelo,
          placa: motoData.placa,
          ano: motoData.ano,
          km: kmAtual + 1000 // próxima revisão em 1000km
        },
        servicos: [{
          tipo: 'manutencao',
          descricao: 'Primeira revisão programada',
          valor: 150
        }],
        status: 'aberta',
        prioridade: 'media',
        datas: {
          previsaoEntrega: new Date(dataProximaRevisao)
        }
      });
      
      await ordemRevisao.save();
      
      res.json({
        message: 'Venda registrada e revisão agendada com sucesso',
        cliente,
        ordemRevisao
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Orçamento automático baseado na OS
  async gerarOrcamentoOS(req, res) {
    try {
      const { osId } = req.params;
      
      const os = await OrdemServico.findById(osId)
        .populate('cliente')
        .populate('pecas.produto');
      
      if (!os) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }
      
      // Calcular desconto baseado na fidelidade do cliente
      let percentualDesconto = 0;
      if (os.cliente.nivelFidelidade === 'ouro') percentualDesconto = 0.10;
      else if (os.cliente.nivelFidelidade === 'prata') percentualDesconto = 0.05;
      
      const subtotalServicos = os.servicos.reduce((sum, s) => sum + (s.valor || 0), 0);
      const subtotalPecas = os.pecas.reduce((sum, p) => sum + p.valorTotal, 0);
      const subtotal = subtotalServicos + subtotalPecas;
      const desconto = subtotal * percentualDesconto;
      const total = subtotal - desconto;
      
      const orcamento = {
        numero: os.numero,
        cliente: os.cliente.nome,
        servicos: os.servicos,
        pecas: os.pecas,
        valores: {
          subtotalServicos,
          subtotalPecas,
          subtotal,
          desconto,
          percentualDesconto: (percentualDesconto * 100),
          total
        },
        validade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
        observacoes: `Desconto de ${(percentualDesconto * 100)}% aplicado - Cliente ${os.cliente.nivelFidelidade.toUpperCase()}`
      };
      
      res.json(orcamento);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Verificar compatibilidade de peças
  async verificarCompatibilidade(req, res) {
    try {
      const { marca, modelo, ano } = req.query;
      
      const pecasCompativeis = await Produto.find({
        'compatibilidade.marca': { $regex: marca, $options: 'i' },
        'compatibilidade.modelo': { $regex: modelo, $options: 'i' },
        'compatibilidade.anoInicial': { $lte: ano },
        'compatibilidade.anoFinal': { $gte: year },
        ativo: true,
        estoqueAtual: { $gt: 0 }
      });
      
      res.json(pecasCompativeis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Sugerir peças para revisão
  async sugerirPecasRevisao(req, res) {
    try {
      const { km, tipoRevisao, marca, modelo } = req.query;
      
      let sugestoes = [];
      
      // Sugestões baseadas na quilometragem
      if (km <= 1000) {
        sugestoes = ['Filtro de óleo', 'Óleo do motor'];
      } else if (km <= 5000) {
        sugestoes = ['Filtro de óleo', 'Óleo do motor', 'Filtro de ar'];
      } else if (km <= 10000) {
        sugestoes = ['Filtro de óleo', 'Óleo do motor', 'Filtro de ar', 'Velas de ignição'];
      } else {
        sugestoes = ['Filtro de óleo', 'Óleo do motor', 'Filtro de ar', 'Velas de ignição', 'Pastilha de freio'];
      }
      
      // Buscar produtos correspondentes
      const produtos = await Produto.find({
        nome: { $in: sugestoes.map(s => new RegExp(s, 'i')) },
        'compatibilidade.marca': { $regex: marca, $options: 'i' },
        'compatibilidade.modelo': { $regex: modelo, $options: 'i' },
        ativo: true,
        estoqueAtual: { $gt: 0 }
      }).select('nome preco estoqueAtual categoria');
      
      res.json({
        sugestoes,
        produtos,
        observacao: `Sugestões baseadas em ${km}km rodados`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = integracaoController;