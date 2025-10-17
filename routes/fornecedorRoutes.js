const express = require('express');
const router = express.Router();

// Gerar pedido automático
router.post('/pedidos/automatico', fornecedorController.gerarPedidoAutomatico);

// Listar pedidos
router.get('/pedidos', fornecedorController.listarPedidos);

// Confirmar recebimento
router.post('/pedidos/:id/receber', fornecedorController.confirmarRecebimento);

module.exports = router;