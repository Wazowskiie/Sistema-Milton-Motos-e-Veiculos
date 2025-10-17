const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
  cliente: String,
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  quantidade: { type: Number, required: true, min: 1 },
  precoUnitario: { type: Number, required: true, min: 0 },
  total: { type: Number, default: 0 },
  observacao: String,
  data: { type: Date, default: Date.now }
});

vendaSchema.pre('save', function(next){
  this.total = Number((this.quantidade * this.precoUnitario).toFixed(2));
  next();
});

module.exports = mongoose.model('Venda', vendaSchema);
