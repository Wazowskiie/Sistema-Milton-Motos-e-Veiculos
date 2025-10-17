const mongoose = require('mongoose');

const orcamentoSchema = new mongoose.Schema({
  numero: { type: String, unique: true },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente'
  },
  clienteAvulso: {
    nome: String,
    telefone: String,
    email: String
  },
  veiculo: {
    marca: String,
    modelo: String,
    ano: Number,
    placa: String,
    km: Number
  },
  
  itens: [{
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
    quantidade: { type: Number, required: true },
    precoUnitario: { type: Number, required: true },
    desconto: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  
  servicos: [{
    descricao: String,
    quantidade: { type: Number, default: 1 },
    precoUnitario: Number,
    total: Number
  }],
  
  valores: {
    subtotalPecas: Number,
    subtotalServicos: Number,
    subtotal: Number,
    desconto: { type: Number, default: 0 },
    percentualDesconto: Number,
    acrescimo: { type: Number, default: 0 },
    total: Number
  },
  
  condicoesPagamento: {
    formaPagamento: {
      type: String,
      enum: ['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'boleto', 'parcelado'],
      default: 'dinheiro'
    },
    parcelas: { type: Number, default: 1 },
    entrada: Number,
    valorParcela: Number
  },
  
  status: {
    type: String,
    enum: ['rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado', 'convertido'],
    default: 'rascunho'
  },
  
  validade: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 dias
    }
  },
  
  observacoes: String,
  condicoes: String,
  
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  dataEnvio: Date,
  dataResposta: Date,
  dataExpiracao: Date,
  
  historicoStatus: [{
    status: String,
    data: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    observacao: String
  }],
  
  dataCriacao: { type: Date, default: Date.now }
});

// Auto-geração de número
orcamentoSchema.pre('save', async function(next) {
  if (!this.numero) {
    const count = await this.constructor.countDocuments();
    this.numero = `ORC${(count + 1).toString().padStart(6, '0')}`;
  }
  
  // Calcular totais
  this.valores.subtotalPecas = this.itens.reduce((sum, item) => sum + item.total, 0);
  this.valores.subtotalServicos = this.servicos.reduce((sum, serv) => sum + serv.total, 0);
  this.valores.subtotal = this.valores.subtotalPecas + this.valores.subtotalServicos;
  this.valores.total = this.valores.subtotal - this.valores.desconto + this.valores.acrescimo;
  
  next();
});

module.exports = mongoose.models.Orcamento || mongoose.model('Orcamento', orcamentoSchema);