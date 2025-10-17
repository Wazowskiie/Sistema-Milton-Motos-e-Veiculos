const mongoose = require('mongoose');

const ordemServicoSchema = new mongoose.Schema({
  numero: { type: String, unique: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  moto: {
    marca: String,
    modelo: String,
    placa: String,
    ano: Number,
    km: Number
  },
  
  servicos: [{
    tipo: { type: String, enum: ['manutencao', 'reparo', 'instalacao', 'diagnostico'] },
    descricao: String,
    tempoEstimado: Number, // em minutos
    valor: Number,
    mecanico: String,
    status: { type: String, enum: ['pendente', 'em_andamento', 'concluido'], default: 'pendente' }
  }],
  
  pecas: [{
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
    quantidade: Number,
    valorUnitario: Number,
    valorTotal: Number
  }],
  
  status: {
    type: String,
    enum: ['aberta', 'em_andamento', 'aguardando_pecas', 'concluida', 'entregue', 'cancelada'],
    default: 'aberta'
  },
  
  prioridade: { type: String, enum: ['baixa', 'media', 'alta', 'urgente'], default: 'media' },
  
  valores: {
    subtotalServicos: Number,
    subtotalPecas: Number,
    desconto: { type: Number, default: 0 },
    total: Number
  },
  
  datas: {
    entrada: { type: Date, default: Date.now },
    previsaoEntrega: Date,
    entrega: Date
  },
  
  observacoes: String,
  fotos: [String], // URLs das fotos
  garantia: {
    servicos: { type: Number, default: 90 }, // dias
    pecas: { type: Number, default: 90 }
  },
  
  avaliacaoCliente: {
    nota: { type: Number, min: 1, max: 5 },
    comentario: String,
    data: Date
  }
});

// Auto-incremento do número da OS
ordemServicoSchema.pre('save', async function(next) {
  if (!this.numero) {
    const count = await this.constructor.countDocuments();
    this.numero = `OS${(count + 1).toString().padStart(6, '0')}`;
  }
  
  // Calcular totais
  this.valores.subtotalServicos = this.servicos.reduce((sum, s) => sum + (s.valor || 0), 0);
  this.valores.subtotalPecas = this.pecas.reduce((sum, p) => sum + (p.valorTotal || 0), 0);
  this.valores.total = this.valores.subtotalServicos + this.valores.subtotalPecas - this.valores.desconto;
  
  next();
});

module.exports = mongoose.model('OrdemServico', ordemServicoSchema);