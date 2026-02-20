const express = require('express');
const router = express.Router();
const { 
  dashboardController, 
  agendamentoController, 
  integracaoController, 
  relatorioController 
} = require('../controllers/funcionalidades');

// Dashboard
router.get('/dashboard/indicadores', dashboardController.indicadoresGerais);
router.get('/dashboard/vendas', dashboardController.graficoVendas);

// Agendamentos
router.post('/agendamentos', agendamentoController.criarAgendamento);
router.get('/agendamentos', agendamentoController.listarAgendamentos);
router.get('/agendamentos/horarios', agendamentoController.horariosDisponiveis);

// Integrações
router.post('/integracao/venda-moto', integracaoController.vendaMotoComRevisao);
router.get('/integracao/orcamento/:osId', integracaoController.gerarOrcamentoOS);
router.get('/integracao/compatibilidade', integracaoController.verificarCompatibilidade);
router.get('/integracao/sugestoes-revisao', integracaoController.sugerirPecasRevisao);

// Relatórios
router.get('/relatorios/vendas', relatorioController.relatorioVendas);
router.get('/relatorios/estoque', relatorioController.relatorioEstoque);
router.get('/relatorios/servicos', relatorioController.relatorioServicos);

module.exports = router;
