const mongoose = require('mongoose');

const enderecoSchema = new mongoose.Schema({
  rua: String,
  numero: String,
  bairro: String,
  cidade: String,
  cep: String,
  estado: String
});

const motoSchema = new mongoose.Schema({
  marca: String,
  modelo: String,
  ano: Number,
  cor: String,
  placa: String,
  chassi: String,
  kmAtual: { type: Number, default: 0 },
  dataCompra: Date,
  valorCompra: Number
});

const clienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cpf: String,
  cnpj: String,
  email: String,
  telefone: { type: String, required: true },
  whatsapp: String,
  endereco: enderecoSchema,
  motos: [motoSchema],
  tipoCliente: { type: String, enum: ['fisico', 'juridico'], default: 'fisico' },
  
  // Sistema de Fidelidade
  pontosAcumulados: { type: Number, default: 0 },
  nivelFidelidade: { 
    type: String, 
    enum: ['bronze', 'prata', 'ouro'], 
    default: 'bronze' 
  },
  
  historicoCompras: [{
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
    quantidade: Number,
    valor: Number,
    data: { type: Date, default: Date.now },
    pontos: Number
  }],
  
  dataCadastro: { type: Date, default: Date.now },
  ativo: { type: Boolean, default: true }
});

// Calcular nível de fidelidade automaticamente
clienteSchema.pre('save', function(next) {
  if (this.pontosAcumulados >= 1000) {
    this.nivelFidelidade = 'ouro';
  } else if (this.pontosAcumulados >= 500) {
    this.nivelFidelidade = 'prata';
  } else {
    this.nivelFidelidade = 'bronze';
  }
  next();
});

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', clienteSchema);