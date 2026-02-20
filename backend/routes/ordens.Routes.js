const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/ordemController');

router.get('/', auth, controller.listarOrdens);
router.post('/', controller.criarOrdem);
router.put('/:id', auth, controller.atualizarOrdem);
router.delete('/:id', auth, controller.excluirOrdem);

module.exports = router;
