const express = require('express');
const router = express.Router();

// 🔴 AJUSTA AQUI SE O NOME DO ARQUIVO DE AUTH FOR DIFERENTE
const auth = require('../middleware/auth.middleware');

const controller = require('../controllers/mecanicoController');

router.get('/', auth, controller.listarMecanicos);
router.post('/', controller.criarMecanico);
router.put('/:id', auth, controller.atualizarMecanico);
router.delete('/:id', auth, controller.excluirMecanico);

module.exports = router;
