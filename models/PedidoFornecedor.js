const pedidoFornecedorSchema = new mongoose.Schema({
  numero: { type: String, unique: true },
  fornecedor: {
    nome: String,
    contato: String,
    telefone: String,
    email: String
  },
  
  itens: [{
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
    codigoProduto: String,
    descricao: String,
    quantidade: { type: Number, required: true },
    precoUnitario: Number,
    total: Number
  }],
  
  valores: {
    subtotal: Number,
    frete: { type: Number, default: 0 },
    impostos: { type: Number, default: 0 },
    desconto: { type: Number, default: 0 },
    total: Number
  },
  
  status: {
    type: String,
    enum: ['rascunho', 'enviado', 'confirmado', 'em_transito', 'entregue', 'cancelado'],
    default: 'rascunho'
  },
  
  prazos: {
    entrega: Date,
    pagamento: Date,
    recebimento: Date
  },
  
  observacoes: String,
  condicoesPagamento: String,
  numeroNotaFiscal: String,
  
  solicitante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  dataCriacao: { type: Date, default: Date.now }
});

pedidoFornecedorSchema.pre('save', async function(next) {
  if (!this.numero) {
    const count = await this.constructor.countDocuments();
    this.numero = `PED${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

const PedidoFornecedor = mongoose.models.PedidoFornecedor || mongoose.model('PedidoFornecedor', pedidoFornecedorSchema);
