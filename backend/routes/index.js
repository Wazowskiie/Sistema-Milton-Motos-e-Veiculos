const express = require('express');
const router = express.Router();

router.use('/usuarios', require('./usuario.Routes'));
router.use('/produtos', require('./produto.Routes'));
router.use('/estoque', require('./estoque-avancado.Routes'));
router.use('/vendas', require('./venda.Routes'));
router.use('/dashboard', require('./dashboard.Routes'));
router.use('/auth', require('../middleware/auth.middleware'));
router.use('/dashboard', require('./dashboard.Routes'));
module.exports = router;
