// controllers/relatorioController.js - Sistema de relatórios
const relatorioController = {
  async relatorioVendas(req, res) {
    try {
      const { dataInicio, dataFim, categoria, cliente } = req.query;
      
      const filtros = {};
      if (dataInicio && dataFim) {
        filtros.data = {
          $gte: new Date(dataInicio),
          $lte: new Date(dataFim)
        };
      }
      
      const pipeline = [
        { $match: filtros },
        { $unwind: '$itens' },
        {
          $lookup: {
            from: 'produtos',
            localField: 'itens.produto',
            foreignField: '_id',
            as: 'produto'
          }
        },
        { $unwind: '$produto' },
        {
          $lookup: {
            from: 'clientes',
            localField: 'cliente',
            foreignField: '_id',
            as: 'clienteInfo'
          }
        },
        { $unwind: '$clienteInfo' }
      ];
      
      if (categoria) {
        pipeline.push({ $match: { 'produto.categoria': categoria } });
      }
      
      if (cliente) {
        pipeline.push({ $match: { 'clienteInfo._id': cliente } });
      }
      
      pipeline.push(
        {
          $group: {
            _id: {
              produto: '$produto.nome',
              categoria: '$produto.categoria',
              cliente: '$clienteInfo.nome'
            },
            quantidadeVendida: { $sum: '$itens.quantidade' },
            faturamento: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } },
            numeroVendas: { $sum: 1 }
          }
        },
        { $sort: { faturamento: -1 } }
      );
      
      const resultado = await Venda.aggregate(pipeline);
      
      // Totalizadores
      const resumo = {
        totalVendas: resultado.reduce((sum, item) => sum + item.numeroVendas, 0),
        totalFaturamento: resultado.reduce((sum, item) => sum + item.faturamento, 0),
        totalItens: resultado.reduce((sum, item) => sum + item.quantidadeVendida, 0),
        produtoMaisVendido: resultado[0] || null
      };
      
      res.json({ resumo, detalhes: resultado });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async relatorioEstoque(req, res) {
    try {
      const { categoria, situacao } = req.query;
      
      const filtros = { ativo: true };
      if (categoria) filtros.categoria = categoria;
      
      let produtos = await Produto.find(filtros);
      
      // Filtrar por situação do estoque
      if (situacao === 'baixo') {
        produtos = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo);
      } else if (situacao === 'zerado') {
        produtos = produtos.filter(p => p.estoqueAtual === 0);
      } else if (situacao === 'excesso') {
        produtos = produtos.filter(p => p.estoqueAtual > (p.estoqueMaximo || p.estoqueMinimo * 5));
      }
      
      // Calcular valores
      const valorTotalEstoque = produtos.reduce((sum, p) => 
        sum + (p.estoqueAtual * (p.precoCusto || p.precoVenda * 0.7)), 0
      );
      
      const resumo = {
        totalProdutos: produtos.length,
        valorTotalEstoque,
        produtosBaixoEstoque: produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).length,
        produtosZerados: produtos.filter(p => p.estoqueAtual === 0).length,
        categoriasAfetadas: [...new Set(produtos.map(p => p.categoria))]
      };
      
      res.json({ resumo, produtos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async relatorioServicos(req, res) {
    try {
      const { dataInicio, dataFim, status, mecanico } = req.query;
      
      const filtros = {};
      if (dataInicio && dataFim) {
        filtros['datas.entrada'] = {
          $gte: new Date(dataInicio),
          $lte: new Date(dataFim)
        };
      }
      
      if (status) filtros.status = status;
      
      const ordens = await OrdemServico.find(filtros)
        .populate('cliente', 'nome telefone nivelFidelidade')
        .sort({ 'datas.entrada': -1 });
      
      // Filtrar por mecânico se especificado
      let ordensFiltradas = ordens;
      if (mecanico) {
        ordensFiltradas = ordens.filter(os => 
          os.servicos.some(s => s.mecanico === mecanico)
        );
      }
      
      // Calcular métricas
      const tempoMedioAtendimento = ordensFiltradas
        .filter(os => os.datas.entrega)
        .reduce((sum, os) => {
          const tempo = (os.datas.entrega - os.datas.entrada) / (1000 * 60 * 60 * 24);
          return sum + tempo;
        }, 0) / ordensFiltradas.filter(os => os.datas.entrega).length || 0;
      
      const faturamentoTotal = ordensFiltradas.reduce((sum, os) => sum + (os.valores?.total || 0), 0);
      
      const resumo = {
        totalOrdens: ordensFiltradas.length,
        ordensAbertas: ordensFiltradas.filter(os => os.status === 'aberta').length,
        ordensEmAndamento: ordensFiltradas.filter(os => os.status === 'em_andamento').length,
        ordensConcluidas: ordensFiltradas.filter(os => os.status === 'concluida').length,
        tempoMedioAtendimento: Math.round(tempoMedioAtendimento),
        faturamentoTotal,
        servicoMaisComum: null // Calcular depois
      };
      
      res.json({ resumo, ordens: ordensFiltradas });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = relatorioController;