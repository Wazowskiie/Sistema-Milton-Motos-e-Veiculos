const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.listar);
router.get('/revisoes-pendentes', clienteController.revisoesPendentes);
router.get('/:id', clienteController.buscarPorId);
router.post('/', clienteController.criar);
router.put('/:id', clienteController.atualizar);
router.post('/:id/motos', clienteController.adicionarMoto);

module.exports = router;