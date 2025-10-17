const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Autenticação
router.post('/login', usuarioController.login);
router.post('/registrar', usuarioController.registrar);
router.post('/cadastro', usuarioController.registrar); // Alias para frontend

// CRUD de usuários (requer autenticação)
router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);
router.put('/:id', usuarioController.atualizar);
router.put('/:id/senha', usuarioController.alterarSenha);

module.exports = router;