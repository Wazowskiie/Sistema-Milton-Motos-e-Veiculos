const Cliente = require('../models/Cliente');

exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ criadoEm: -1 });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar clientes' });
  }
};

exports.criarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao criar cliente' });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(cliente);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar cliente' });
  }
};

exports.excluirCliente = async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao excluir cliente' });
  }
};
