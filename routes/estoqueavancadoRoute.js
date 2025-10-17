const express = require('express');
const auth = require('../middleware/auth');
const estoqueAvancadoController = require('../controllers/estoqueAvancadoController');

const router = express.Router();
router.use(auth);

router.get('/alertas', estoqueAvancadoController.alertasEstoque);
router.get('/mapa', estoqueAvancadoController.mapearLocalizacao);
router.get('/historico-precos/:produtoId', estoqueAvancadoController.historicoPrecos);

module.exports = router;
