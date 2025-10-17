const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  senha: {
    type: String,
    required: true,
    minlength: 6
  },
  nivel: {
    type: String,
    enum: ['admin', 'gerente', 'funcionario'],
    default: 'funcionario'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimoLogin: {
    type: Date
  },
  telefone: String,
  observacoes: String
});

// Índice para consultas rápidas por email
usuarioSchema.index({ email: 1 });

// Verificar se o modelo já existe para evitar conflitos
module.exports = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);