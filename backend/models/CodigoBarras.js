const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  codigo: String,
  nome: String,
  categoria: String,
  marca: String,
  modelo: String,
  preco: Number,
  quantidade: Number,
  estoqueMinimo: Number,
  descricao: String,

  codigoBarras: {
    type: String,
    default: null
  },
  tipoCodigoBarras: {
    type: String,
    default: 'EAN13'
  },

  ativo: {
    type: Boolean,
    default: true
  }
});
module.exports = mongoose.model('Produto', ProdutoSchema);