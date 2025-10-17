const Cliente = require('../models/Cliente');
const Produto = require('../models/Produto');
const OrdemServico = require('../models/OrdemServico');
const Venda = require('../models/Venda');

const dashboardController = {
  async indicadoresGerais(req, res) {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      
      // Indicadores do mês atual
      const [
        totalClientes,
        clientesNovosMes,
        faturamentoMes,
        ordensAbertas,
        produtosBaixoEstoque,
        revisoesPendentes
      ] = await Promise.all([
        Cliente.countDocuments({ ativo: true }),
        Cliente.countDocuments({ dataCadastro: { $gte: inicioMes } }),
        Venda.aggregate([
          { $match: { data: { $gte: inicioMes, $lte: fimMes } } },
          { $group: { _id: null, total: { $sum: '$valorTotal' } } }
        ]),
        OrdemServico.countDocuments({ status: { $in: ['aberta', 'em_andamento'] } }),
        Produto.countDocuments({ $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] } }),
        Cliente.countDocuments({
          'historicoServicos.proximaRevisao': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        })
      ]);
      
      // Vendas por categoria (últimos 7 dias)
      const vendasCategoria = await Venda.aggregate([
        { $match: { data: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
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
          $group: {
            _id: '$produto.categoria',
            quantidade: { $sum: '$itens.quantidade' },
            valor: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
          }
        },
        { $sort: { valor: -1 } }
      ]);
      
      res.json({
        indicadores: {
          totalClientes,
          clientesNovosMes,
          faturamentoMes: faturamentoMes[0]?.total || 0,
          ordensAbertas,
          produtosBaixoEstoque,
          revisoesPendentes
        },
        vendasCategoria
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async graficoVendas(req, res) {
    try {
      const { periodo = '30' } = req.query;
      const diasAtras = parseInt(periodo);
      const dataInicio = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
      
      const vendas = await Venda.aggregate([
        { $match: { data: { $gte: dataInicio } } },
        {
          $group: {
            _id: {
              dia: { $dayOfMonth: '$data' },
              mes: { $month: '$data' },
              ano: { $year: '$data' }
            },
            vendas: { $sum: 1 },
            faturamento: { $sum: '$valorTotal' }
          }
        },
        { $sort: { '_id.ano': 1, '_id.mes': 1, '_id.dia': 1 } }
      ]);
      
      res.json(vendas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};