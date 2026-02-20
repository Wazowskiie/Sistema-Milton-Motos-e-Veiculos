const mongoose = require('mongoose');

const OrdemServicoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  mecanico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mecanico',
    required: true
  },
  descricao: { type: String, required: true },
  valor: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['aberta', 'em andamento', 'finalizada'],
    default: 'aberta'
  },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrdemServico', OrdemServicoSchema);
