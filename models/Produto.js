const mongoose = require('mongoose');

const fornecedorSchema = new mongoose.Schema({
  nome: String,
  contato: String,
  telefone: String,
  email: String,
  prazoEntrega: Number,
  valorMinimoPedido: Number,
  observacoes: String
});

const localizacaoSchema = new mongoose.Schema({
  corredor: String,
  prateleira: String,
  posicao: String,
  observacoes: String
});

const compatibilidadeSchema = new mongoose.Schema({
  marca: String,
  modelo: String,
  anoInicial: Number,
  anoFinal: Number,
  cilindrada: String,
  observacoes: String
});

const produtoSchema = new mongoose.Schema({
  codigo: { type: String, unique: true },
  codigoBarras: String,
  nome: { type: String, required: true },
  marca: String,
  categoria: { 
    type: String, 
    enum: ['motor', 'freio', 'suspensao', 'eletrica', 'carroceria', 'transmissao', 'pneus', 'outros'] 
  },
  subcategoria: String,
  descricao: String,
  
  // Sistema de Compatibilidade
  compatibilidade: [compatibilidadeSchema],
  aplicacao: String, // Descrição geral de aplicação
  
  // Preços e Custos
  precoCusto: Number,
  precoVenda: { type: Number, required: true },
  margemLucro: Number,
  precoPromocional: Number,
  dataPromocao: {
    inicio: Date,
    fim: Date
  },
  
  // Controle de Estoque
  estoqueMinimo: { type: Number, default: 5 },
  estoqueAtual: { type: Number, required: true },
  estoqueMaximo: Number,
  pontoReposicao: Number,
  
  // Localização Física
  localizacao: localizacaoSchema,
  
  // Fornecedor
  fornecedor: fornecedorSchema,
  fornecedorSecundario: fornecedorSchema,
  
  // Características físicas
  peso: Number,
  dimensoes: {
    altura: Number,
    largura: Number,
    profundidade: Number
  },
  
  // Histórico de Preços
  historicoPrecos: [{
    preco: Number,
    data: { type: Date, default: Date.now },
    motivo: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  }],
  
  // Dados de venda
  quantidadeVendida: { type: Number, default: 0 },
  ultimaVenda: Date,
  ultimaCompra: Date,
  
  // Controle
  ativo: { type: Boolean, default: true },
  destaque: { type: Boolean, default: false },
  promocao: { type: Boolean, default: false },
  dataCadastro: { type: Date, default: Date.now },
  
  // Imagens e Documentos
  imagens: [String],
  manuais: [String],
  certificados: [String],
  
  // SEO e Tags
  tags: [String],
  palavrasChave: String,
  
  // Avaliações
  avaliacoes: [{
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    nota: { type: Number, min: 1, max: 5 },
    comentario: String,
    data: { type: Date, default: Date.now }
  }],
  notaMedia: { type: Number, default: 0 }
});

// Auto-geração de código
produtoSchema.pre('save', async function(next) {
  if (!this.codigo) {
    const count = await this.constructor.countDocuments();
    this.codigo = `P${(count + 1).toString().padStart(6, '0')}`;
  }
  
  // Calcular margem de lucro
  if (this.precoCusto && this.precoVenda) {
    this.margemLucro = ((this.precoVenda - this.precoCusto) / this.precoCusto * 100).toFixed(2);
  }
  
  // Calcular nota média
  if (this.avaliacoes.length > 0) {
    const soma = this.avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    this.notaMedia = (soma / this.avaliacoes.length).toFixed(1);
  }
  
  next();
});

// Métodos do modelo
produtoSchema.methods.precisaReposicao = function() {
  return this.estoqueAtual <= this.estoqueMinimo;
};

produtoSchema.methods.estaEmPromocao = function() {
  if (!this.dataPromocao.inicio || !this.dataPromocao.fim) return false;
  const agora = new Date();
  return agora >= this.dataPromocao.inicio && agora <= this.dataPromocao.fim;
};

produtoSchema.methods.precoAtual = function() {
  return this.estaEmPromocao() ? this.precoPromocional : this.precoVenda;
};

module.exports = mongoose.models.Produto || mongoose.model('Produto', produtoSchema);