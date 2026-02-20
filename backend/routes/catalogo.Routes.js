const express = require('express');
const router = express.Router();
const { catalogoController } = require('../controllers/funcionalidades-avancadas');

// Busca por compatibilidade
router.get('/compatibilidade', catalogoController.buscarPorMoto);

// Busca por código de barras
router.get('/codigo-barras/:codigo', catalogoController.buscarPorCodigoBarras);

// Produtos em destaque e promoção
router.get('/destaques', catalogoController.produtosDestaque);

module.exports = router;