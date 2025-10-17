const Orcamento = require('../models/Orcamento');
const Produto = require('../models/Produto');
const Cliente = require('../models/Cliente');

const orcamentoController = {
  // Criar orçamento automático baseado em veículo
  async criarAutomatico(req, res) {
    try {
      const { veiculo, tipoServico, clienteId } = req.body;
      
      let cliente = null;
      if (clienteId) {
        cliente = await Cliente.findById(clienteId);
      }
      
      // Buscar peças compatíveis automaticamente
      const pecasRecomendadas = await this.buscarPecasRecomendadas(veiculo, tipoServico);
      
      // Calcular desconto baseado na fidelidade
      let percentualDesconto = 0;
      if (cliente) {
        percentualDesconto = this.calcularDescontoFidelidade(cliente.nivelFidelidade);
      }
      
      const itens = pecasRecomendadas.map(peca => ({
        produto: peca._id,
        quantidade: peca.quantidadeSugerida || 1,
        precoUnitario: peca.precoAtual(),
        desconto: peca.precoAtual() * percentualDesconto,
        total: (peca.precoAtual() - (peca.precoAtual() * percentualDesconto)) * (peca.quantidadeSugerida || 1)
      }));
      
      // Adicionar serviços baseados no tipo
      const servicos = await this.buscarServicosRecomendados(tipoServico);
      
      const orcamento = new Orcamento({
        cliente: clienteId,
        veiculo,
        itens,
        servicos,
        valores: {
          percentualDesconto: percentualDesconto * 100
        },
        vendedor: req.user?.id,
        observacoes: `Orçamento automático para ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}`,
        condicoes: cliente ? `Desconto ${(percentualDesconto * 100).toFixed(0)}% - Cliente ${cliente.nivelFidelidade.toUpperCase()}` : null
      });
      
      await orcamento.save();
      await orcamento.populate(['cliente', 'itens.produto']);
      
      res.status(201).json({
        message: 'Orçamento criado automaticamente',
        orcamento,
        resumo: {
          totalItens: itens.length,
          totalServicos: servicos.length,
          valorTotal: orcamento.valores.total,
          descontoAplicado: percentualDesconto > 0
        }
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Buscar peças recomendadas por veículo e tipo de serviço
  async buscarPecasRecomendadas(veiculo, tipoServico) {
    const recomendacoes = {
      'revisao': ['Filtro de óleo', 'Óleo do motor', 'Filtro de ar'],
      'freios': ['Pastilha de freio', 'Disco de freio', 'Fluido de freio'],
      'embreagem': ['Kit embreagem', 'Cabo de embreagem', 'Fluido embreagem'],
      'suspensao': ['Amortecedor', 'Mola', 'Batente'],
      'motor': ['Vela de ignição', 'Filtro de combustível', 'Correia']
    };
    
    const nomesPecas = recomendacoes[tipoServico] || [];
    
    return await Produto.find({
      nome: { $in: nomesPecas.map(nome => new RegExp(nome, 'i')) },
      'compatibilidade.marca': { $regex: veiculo.marca, $options: 'i' },
      'compatibilidade.modelo': { $regex: veiculo.modelo, $options: 'i' },
      'compatibilidade.anoInicial': { $lte: veiculo.ano },
      'compatibilidade.anoFinal': { $gte: veiculo.ano },
      ativo: true,
      estoqueAtual: { $gt: 0 }
    }).limit(10);
  },
  
  // Buscar serviços recomendados
  async buscarServicosRecomendados(tipoServico) {
    const servicosPadrao = {
      'revisao': [
        { descricao: 'Troca de óleo e filtro', precoUnitario: 80, total: 80 },
        { descricao: 'Verificação geral', precoUnitario: 50, total: 50 }
      ],
      'freios': [
        { descricao: 'Troca de pastilhas', precoUnitario: 120, total: 120 },
        { descricao: 'Sangria do sistema', precoUnitario: 60, total: 60 }
      ],
      'embreagem': [
        { descricao: 'Troca kit embreagem', precoUnitario: 200, total: 200 }
      ]
    };
    
    return servicosPadrao[tipoServico] || [];
  },
  
  calcularDescontoFidelidade(nivel) {
    const descontos = { bronze: 0, prata: 0.05, ouro: 0.10 };
    return descontos[nivel] || 0;
  },
  
  // Converter orçamento em venda
  async converterEmVenda(req, res) {
    try {
      const { id } = req.params;
      const orcamento = await Orcamento.findById(id).populate('itens.produto');
      
      if (!orcamento) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }
      
      if (orcamento.status !== 'aprovado') {
        return res.status(400).json({ error: 'Orçamento deve estar aprovado para conversão' });
      }
      
      // Verificar estoque disponível
      for (const item of orcamento.itens) {
        if (item.produto.estoqueAtual < item.quantidade) {
          return res.status(400).json({ 
            error: `Estoque insuficiente para ${item.produto.nome}`,
            disponivel: item.produto.estoqueAtual,
            necessario: item.quantidade
          });
        }
      }
      
      // Criar venda (implementar conforme seu modelo de Venda)
      const vendaData = {
        cliente: orcamento.cliente,
        itens: orcamento.itens,
        subtotal: orcamento.valores.subtotal,
        desconto: orcamento.valores.desconto,
        valorTotal: orcamento.valores.total,
        observacoes: `Venda gerada do orçamento ${orcamento.numero}`,
        orcamentoOrigem: orcamento._id
      };
      
      // Atualizar status do orçamento
      orcamento.status = 'convertido';
      orcamento.historicoStatus.push({
        status: 'convertido',
        usuario: req.user?.id,
        observacao: 'Convertido em venda'
      });
      
      await orcamento.save();
      
      res.json({
        message: 'Orçamento convertido em venda com sucesso',
        orcamento: orcamento.numero,
        // venda: novaVenda // implementar quando tiver modelo de Venda
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};