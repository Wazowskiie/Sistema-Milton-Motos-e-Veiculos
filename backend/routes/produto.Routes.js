const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Produto = require('../models/Produto');
const produtoController = require('../controllers/produto.Controller');

/* CRUD Produtos */
router.get('/', produtoController.listar);
router.post('/', produtoController.criar);
router.get('/:id', produtoController.buscar);
router.put('/:id', produtoController.atualizar);
router.delete('/:id', produtoController.excluir);

router.get('/', auth, async (req, res) => {
  const produtos = await Produto.find();
  res.json(produtos);
});

router.post('/produtos', async (req, res) => {
  try {
    const produto = new Produto(req.body);
    await produto.save();
    res.status(201).json(produto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar produto' });
  }
});

router.put('/produtos/:id/codigo-barras', async (req, res) => {
  const { codigoBarras, tipoCodigoBarras } = req.body;

  if (!codigoBarras) {
    return res.status(400).json({ erro: 'Código obrigatório' });
  }

  const produto = await Produto.findByIdAndUpdate(
    req.params.id,
    { codigoBarras, tipoCodigoBarras },
    { new: true }
  );

  res.json(produto);
});


module.exports = router;
