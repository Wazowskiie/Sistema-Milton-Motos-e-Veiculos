const mongoose = require('mongoose');

const IntegracaoFornecedorSchema = new mongoose.Schema({
  fornecedor: String,
  endpoint: String,
  ativo: Boolean
}, { timestamps: true });

module.exports =
  mongoose.models.IntegracaoFornecedor ||
  mongoose.model('IntegracaoFornecedor', IntegracaoFornecedorSchema);
