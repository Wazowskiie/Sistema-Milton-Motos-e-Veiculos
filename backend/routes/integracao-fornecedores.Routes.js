const express = require('express');
const router = express.Router();

const integracaoFornecedorController = require(
  '../controllers/integracao-fornecedor.controller'
);

router.get('/', integracaoFornecedorController.listar);
router.post('/', integracaoFornecedorController.criar);

module.exports = router;
