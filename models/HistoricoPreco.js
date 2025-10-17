const mongoose = require('mongoose');

const historicoPrecoSchema = new mongoose.Schema({
    produtoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produto',
        required: true,
        index: true
    },
    precoAnterior: {
        type: Number,
        required: true,
        min: 0
    },
    novoPreco: {
        type: Number,
        required: true,
        min: 0
    },
    variacao: {
        type: Number,
        required: true
    },
    percentualVariacao: {
        type: Number,
        get: function() {
            if (this.precoAnterior === 0) return 0;
            return ((this.novoPreco - this.precoAnterior) / this.precoAnterior * 100).toFixed(2);
        }
    },
    motivo: {
        type: String,
        enum: [
            'ajuste_custo',
            'promocao',
            'sazonalidade',
            'concorrencia',
            'margem_lucro',
            'inflacao',
            'desconto_volume',
            'lancamento',
            'descontinuacao',
            'outros'
        ],
        required: true
    },
    observacoes: {
        type: String,
        maxlength: 500
    },
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    data: {
        type: Date,
        default: Date.now,
        index: true
    },
    aprovado: {
        type: Boolean,
        default: true
    },
    aprovadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    dataAprovacao: {
        type: Date
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'historico_precos'
});

// Índices compostos
historicoPrecoSchema.index({ produtoId: 1, data: -1 });
historicoPrecoSchema.index({ data: -1, motivo: 1 });
historicoPrecoSchema.index({ usuarioId: 1, data: -1 });

// Virtual para calcular diferença em valor
historicoPrecoSchema.virtual('diferencaValor').get(function() {
    return (this.novoPreco - this.precoAnterior).toFixed(2);
});

// Middleware para calcular variação automaticamente
historicoPrecoSchema.pre('save', function(next) {
    if (this.precoAnterior && this.novoPreco) {
        this.variacao = this.novoPreco - this.precoAnterior;
    }
    next();
});

// Métodos estáticos
historicoPrecoSchema.statics.obterHistoricoProduto = function(produtoId, limite = 50) {
    return this.find({ produtoId, ativo: true })
        .populate('usuarioId', 'nome email')
        .sort({ data: -1 })
        .limit(limite);
};

historicoPrecoSchema.statics.obterVariacoesPeriodo = function(dataInicio, dataFim) {
    return this.find({
        data: { $gte: dataInicio, $lte: dataFim },
        ativo: true
    }).populate('produtoId', 'nome sku');
};

historicoPrecoSchema.statics.produtosMaiorVariacao = function(diasPeriodo = 30, limite = 10) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasPeriodo);
    
    return this.aggregate([
        { 
            $match: { 
                data: { $gte: dataInicio },
                ativo: true 
            } 
        },
        {
            $group: {
                _id: '$produtoId',
                totalVariacoes: { $sum: 1 },
                maiorVariacao: { $max: '$variacao' },
                menorVariacao: { $min: '$variacao' },
                variacaoMedia: { $avg: '$variacao' },
                ultimoPreco: { $last: '$novoPreco' }
            }
        },
        {
            $lookup: {
                from: 'produtos',
                localField: '_id',
                foreignField: '_id',
                as: 'produto'
            }
        },
        { $unwind: '$produto' },
        { $sort: { maiorVariacao: -1 } },
        { $limit: limite }
    ]);
};

module.exports = mongoose.model('HistoricoPreco', historicoPrecoSchema);