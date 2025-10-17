const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
// const auth = require('../middleware/auth'); router.use(auth); // se usar auth

// Prefixos fixos SEMPRE antes de '/:id'
router.post('/', vendaController.criar);
router.post('/cadastro', vendaController.criar); // compatibilidade
router.get('/', vendaController.listar);

router.get('/:id', vendaController.buscarPorId);
router.delete('/:id', vendaController.deletar);

module.exports = router;
