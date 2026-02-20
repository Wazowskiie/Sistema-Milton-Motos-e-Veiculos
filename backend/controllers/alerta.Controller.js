const AlertaService = require('../services/alerta.service');

exports.criar = async (req, res) => {
  try {
    const alerta = await AlertaService.criar(req.body);
    res.status(201).json(alerta);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const alertas = await AlertaService.listar();
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

exports.marcarComoLido = async (req, res) => {
  try {
    const alerta = await AlertaService.marcarComoLido(req.params.id);
    res.json(alerta);
  } catch (err) {
    res.status(404).json({ erro: err.message });
  }
};
