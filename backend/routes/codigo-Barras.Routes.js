const express = require('express');
const router = express.Router();
const controller = require('../controllers/codigo-Barras.Controller');

// Gerar automaticamente
router.post('/codigo-barras/gerar', controller.gerar);

// Salvar código em produto
router.put('/produtos/:id/codigo-barras', controller.salvar);

// Buscar por scanner
router.get('/produtos/codigo/:codigo', controller.buscarPorCodigo);

module.exports = router;
