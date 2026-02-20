const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/venda.Controller');

router.get('/', auth, controller.listar);
router.post('/', auth, controller.criar);

module.exports = router;
