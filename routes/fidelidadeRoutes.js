const express = require('express');
const router = express.Router();
const { fidelidadeController } = require('../controllers/funcionalidades-avancadas');

// Adicionar pontos
router.post('/pontos/adicionar', fidelidadeController.adicionarPontos);

// Resgatar pontos
router.post('/pontos/resgatar', fidelidadeController.resgatarPontos);

module.exports = router;