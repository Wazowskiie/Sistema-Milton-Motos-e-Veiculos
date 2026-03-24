const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const produtoController = require('../controllers/produto.Controller');

// CRUD Produtos
router.get('/',     auth, produtoController.listar);
router.post('/',    auth, produtoController.criar);
router.get('/:id',  auth, produtoController.buscar);
router.put('/:id',  auth, produtoController.atualizar);
router.delete('/:id', auth, produtoController.excluir);

module.exports = router;
