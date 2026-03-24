const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  codigo:    { type: String, required: true, unique: true },
  nome:      { type: String, required: true },
  tipo:      { type: String },
  descricao: { type: String },
  preco:     { type: Number, required: true },
  estoque:   { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Disponível', 'Baixo', 'Indisponível'],
    default: 'Disponível'
  },
  codigoBarras:      { type: String, default: null },
  tipoCodigoBarras:  { type: String, default: 'EAN13' },
  ativo:             { type: Boolean, default: true }
}, { timestamps: true });

module.exports =
  mongoose.models.Produto || mongoose.model('Produto', ProdutoSchema);
