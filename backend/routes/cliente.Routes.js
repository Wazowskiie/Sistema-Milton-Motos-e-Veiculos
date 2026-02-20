const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const controller = require('../controllers/cliente.Controller');

router.get('/', auth, controller.listarClientes);
router.post('/', auth, controller.criarCliente);
router.put('/:id', auth, controller.atualizarCliente);
router.delete('/:id', auth, controller.excluirCliente);

module.exports = router;
