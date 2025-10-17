const mongoose = require('mongoose');

const movimentoSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  tipo: { type: String, enum: ['entrada','saida'], required: true },
  quantidade: { type: Number, required: true, min: 1 },
  observacao: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Movimento', movimentoSchema);
