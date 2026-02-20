const Produto = require('../models/Produto');
const Venda = require('../models/Venda');

class DashboardService {
  static async gerarDashboard(usuarioId) {

    // Total em estoque
    const produtos = await Produto.find();
    const estoqueTotal = produtos.reduce(
      (soma, p) => soma + (p.estoqueAtual || 0),
      0
    );

    // Peças recentes
    const pecasRecentes = await Produto.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Vendas do mês
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const vendas = await Venda.find({ createdAt: { $gte: inicioMes } });

    const vendasMes = vendas.reduce(
      (total, v) => total + (v.valorTotal || 0),
      0
    );

    return {
      estoqueTotal,
      mediaDias: 0, // podemos calcular depois
      vendasMes,
      avaliacoesPendentes: 0,
      pecasRecentes
    };
  }
}

module.exports = DashboardService;
