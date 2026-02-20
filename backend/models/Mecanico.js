const mongoose = require('mongoose');

const MecanicoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  telefone: String,
  especialidade: String,
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mecanico', MecanicoSchema);
