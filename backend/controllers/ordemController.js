const OrdemServico = require('../models/OrdemServico');

exports.listarOrdens = async (req, res) => {
  try {
    const ordens = await OrdemServico.find()
      .populate('cliente', 'nome')
      .populate('mecanico', 'nome')
      .sort({ criadoEm: -1 });

    res.json(ordens);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar ordens' });
  }
};

exports.criarOrdem = async (req, res) => {
  try {
    const ordem = await OrdemServico.create(req.body);
    res.status(201).json(ordem);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao criar ordem' });
  }
};

exports.atualizarOrdem = async (req, res) => {
  try {
    const ordem = await OrdemServico.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(ordem);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar ordem' });
  }
};

exports.excluirOrdem = async (req, res) => {
  try {
    await OrdemServico.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao excluir ordem' });
  }
};
