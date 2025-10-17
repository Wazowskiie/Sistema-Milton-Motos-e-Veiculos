const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const Produto = require('../models/Produto'); // <-- Faltava

// IMPORTANTE: rotas com prefixo fixo devem vir ANTES de '/:id'
router.get('/', produtoController.listar);
router.get('/estoque-baixo', produtoController.estoqueBaixo);
router.get('/compatibilidade', produtoController.buscarPorCompatibilidade);

// Busca por código interno
router.get('/codigo/:codigo', produtoController.buscarPorCodigo);

// Busca por código de barras (NÃO pode ficar depois de '/:id')
router.get('/buscar-codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const produto = await Produto.findOne({ codigoBarras: codigo });
    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }

    // normalização para docs antigos
    const o = produto.toObject();
    const precoVenda = (o.precoVenda ?? o.preco ?? 0);
    const estoqueAtual = (o.estoqueAtual ?? o.quantidade ?? o.estoque ?? 0);

    res.json({
      success: true,
      data: {
        ...o,
        precoVenda,
        estoqueAtual,
        fornecedor: o.fornecedor || null // subdocumento; nada de populate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar produto', error: error.message });
  }
});

// CRUD por id (deixe por último para não conflitar)
router.get('/:id', produtoController.buscarPorId);

// Criar produto (suporta POST / e POST /cadastro)
router.post('/', produtoController.criar);
router.post('/cadastro', produtoController.criar);

// Atualizar e deletar
router.put('/:id', produtoController.atualizar);
router.delete('/:id', produtoController.deletar);

module.exports = router;
