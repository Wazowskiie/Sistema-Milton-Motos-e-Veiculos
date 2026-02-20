const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: String,
  email: { type: String, unique: true },
  senha: String
}, { timestamps: true });

module.exports =
  mongoose.models.Usuario ||
  mongoose.model('Usuario', UsuarioSchema);
