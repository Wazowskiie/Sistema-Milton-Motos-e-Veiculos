const Venda = require('../models/Venda');
const Produto = require('../models/Produto');

exports.listar = async (req, res) => {
  const vendas = await Venda.find()
    .populate('produto', 'nome codigo')
    .sort({ criadoEm: -1 });

  res.json(vendas);
};

exports.criar = async (req, res) => {
  const { cliente, produto, quantidade, precoUnitario, observacao } = req.body;

  const prod = await Produto.findById(produto);
  if (!prod) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  if (prod.estoque < quantidade) {
    return res.status(400).json({ error: 'Estoque insuficiente' });
  }

  // 🔻 baixa estoque
  prod.estoque -= quantidade;
  prod.status =
    prod.estoque === 0 ? 'Indisponível' :
    prod.estoque < 5 ? 'Baixo' : 'Disponível';

  await prod.save();

  const venda = await Venda.create({
    cliente,
    produto,
    quantidade,
    precoUnitario,
    total: quantidade * precoUnitario,
    observacao
  });

  res.status(201).json(venda);
};
