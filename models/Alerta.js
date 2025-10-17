const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['estoque_baixo', 'estoque_zerado', 'preco_alterado', 'venda_alta', 'produto_parado', 'fornecedor_atraso'],
    required: true
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'media', 'alta', 'critica'],
    default: 'media'
  },
  titulo: { type: String, required: true },
  mensagem: { type: String, required: true },
  
  // Dados contextuais
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
  fornecedor: String,
  valorAnterior: Number,
  valorAtual: Number,
  quantidadeEstoque: Number,
  
  // Status
  status: {
    type: String,
    enum: ['pendente', 'visualizado', 'resolvido', 'ignorado'],
    default: 'pendente'
  },
  
  // Ações sugeridas
  acoesSugeridas: [String],
  
  // Controle
  criadoPor: { type: String, default: 'sistema' },
  visualizadoPor: [{ 
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    data: { type: Date, default: Date.now }
  }],
  resolvidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  dataResolucao: Date,
  
  dataCriacao: { type: Date, default: Date.now },
  dataExpiracao: Date
});

module.exports = mongoose.models.Alerta || mongoose.model('Alerta', alertaSchema);