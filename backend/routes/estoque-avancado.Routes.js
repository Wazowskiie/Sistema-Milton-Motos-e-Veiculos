const express = require('express');
const router = express.Router();

const estoqueController = require('../controllers/estoque-avancado.controller');

router.post('/adicionar', estoqueController.adicionar);
router.post('/remover', estoqueController.remover);

module.exports = router;
