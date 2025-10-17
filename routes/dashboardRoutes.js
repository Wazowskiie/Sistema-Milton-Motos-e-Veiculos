const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');


router.get('/', async (req, res) => {
  try {
    const totalPecas = await Produto.countDocuments();
    const pecasEmFalta = await Produto.countDocuments({ quantidade: 0 });

    const produtos = await Produto.find({});
    const totalDias = produtos.reduce((soma, prod) => {
      const dias = (Date.now() - new Date(prod.dataCadastro)) / (1000 * 60 * 60 * 24);
      return soma + dias;
    }, 0);
    const mediaDias = produtos.length > 0 ? Math.round(totalDias / produtos.length) : 0;

    const recentes = await Produto.find().sort({ dataCadastro: -1 }).limit(5);
    const maisVendidas = await Produto.find().sort({ quantidadeVendida: -1 }).limit(5);

    res.json({
      totalPecas,
      pecasEmFalta,
      mediaDias,
      recentes,
      maisVendidas
    });

  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
});

module.exports = router;
