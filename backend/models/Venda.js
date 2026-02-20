const mongoose = require('mongoose');

const VendaSchema = new mongoose.Schema({
  cliente: { type: String, required: true },

  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },

  quantidade: { type: Number, required: true },
  precoUnitario: { type: Number, required: true },
  total: { type: Number, required: true },

  observacao: String,
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Venda', VendaSchema);
