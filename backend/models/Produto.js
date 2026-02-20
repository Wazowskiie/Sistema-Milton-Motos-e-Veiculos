const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  tipo: { type: String },
  preco: { type: Number, required: true },
  estoque: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Disponível', 'Baixo', 'Indisponível'],
    default: 'Disponível'
  },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Produto', ProdutoSchema);
