const express = require('express');
const router = express.Router();
const Peca = require('../models/Peca'); 

router.get('/', async (req, res) => {
  try {
    const totalEstoque = await Peca.countDocuments();
    const ultimasPecas = await Peca.find().sort({ dataEntrada: -1 }).limit(4);
    
    res.json({
      estoque: totalEstoque,
      vendasHoje: 15, 
      entradasRecentes: 32,
      servicos: 4,
      ultimasPecas
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar dados' });
  }
});

module.exports = router;
