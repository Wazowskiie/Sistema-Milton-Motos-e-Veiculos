const Mecanico = require('../models/Mecanico');

exports.listarMecanicos = async (req, res) => {
  try {
    const mecanicos = await Mecanico.find().sort({ criadoEm: -1 });
    res.json(mecanicos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar mecânicos' });
  }
};

exports.criarMecanico = async (req, res) => {
  try {
    const mecanico = await Mecanico.create(req.body);
    res.status(201).json(mecanico);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao criar mecânico' });
  }
};

exports.atualizarMecanico = async (req, res) => {
  try {
    const mecanico = await Mecanico.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(mecanico);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar mecânico' });
  }
};

exports.excluirMecanico = async (req, res) => {
  try {
    await Mecanico.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao excluir mecânico' });
  }
};
