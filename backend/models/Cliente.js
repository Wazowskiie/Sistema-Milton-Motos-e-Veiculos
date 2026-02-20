const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  telefone: String,
  email: String,
  cpf: String,
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cliente', ClienteSchema);
