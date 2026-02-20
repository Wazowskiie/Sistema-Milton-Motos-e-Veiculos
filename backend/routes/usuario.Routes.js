const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.Controller');

// CRUD
router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);

// Auth
router.post('/login', usuarioController.login);
router.post('/cadastro', usuarioController.registrar);

module.exports = router;
