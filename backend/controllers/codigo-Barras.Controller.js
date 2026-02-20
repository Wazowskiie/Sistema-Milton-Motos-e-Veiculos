const Produto = require('../models/Produto');
const CodigoBarrasService = require('../services/codigo-barras.service');

exports.gerar = async (req, res) => {
  try {
    const { produtoId } = req.body;

    const codigo = CodigoBarrasService.gerarCodigoEAN13();

    const produto = await Produto.findByIdAndUpdate(
      produtoId,
      { codigoBarras: codigo, tipoCodigoBarras: 'EAN13' },
      { new: true }
    );

    res.status(201).json(produto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.salvar = async (req, res) => {
  const { codigoBarras, tipoCodigoBarras } = req.body;

  const produto = await Produto.findByIdAndUpdate(
    req.params.id,
    { codigoBarras, tipoCodigoBarras },
    { new: true }
  );

  res.json(produto);
};

exports.buscarPorCodigo = async (req, res) => {
  const produto = await Produto.findOne({
    codigoBarras: req.params.codigo
  });

  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  res.json(produto);
};
