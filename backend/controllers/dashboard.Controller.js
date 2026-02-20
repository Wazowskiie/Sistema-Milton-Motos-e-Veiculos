const DashboardService = require('../services/dashboard.service');

exports.getDashboard = async (req, res) => {
  try {
    const dados = await DashboardService.gerarDashboard(req.usuarioId);
    res.json(dados);
  } catch (err) {
    console.error('ERRO DASHBOARD:', err);
    res.status(500).json({
      error: 'Erro ao buscar dados do dashboard'
    });
  }
};
