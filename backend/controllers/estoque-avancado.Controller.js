const EstoqueService = require('../services/estoque.service');

exports.adicionar = async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const produto = await EstoqueService.adicionar(produtoId, quantidade);
    res.json(produto);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

exports.remover = async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const produto = await EstoqueService.remover(produtoId, quantidade);
    res.json(produto);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};
