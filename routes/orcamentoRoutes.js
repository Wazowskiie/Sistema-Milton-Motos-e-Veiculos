const express = require('express');
const router = express.Router();

// Criar orçamento automático
router.post('/automatico', orcamentoController.criarAutomatico);

// Converter orçamento em venda
router.post('/:id/converter', orcamentoController.converterEmVenda);

module.exports = router;