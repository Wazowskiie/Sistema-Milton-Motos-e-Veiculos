const mongoose = require('mongoose');

const codigoBarrasSchema = new mongoose.Schema({
    produtoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produto',
        required: true,
        index: true
    },
    codigo: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tipo: {
        type: String,
        enum: ['EAN13', 'EAN8', 'CODE128', 'CODE39', 'UPC'],
        required: true,
        default: 'EAN13'
    },
    ativo: {
        type: Boolean,
        default: true,
        index: true
    },
    dataCriacao: {
        type: Date,
        default: Date.now
    },
    dataDesativacao: {
        type: Date
    },
    observacoes: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'codigos_barras'
});

// Índices compostos
codigoBarrasSchema.index({ produtoId: 1, ativo: 1 });
codigoBarrasSchema.index({ codigo: 1, tipo: 1 });

// Middleware para desativar códigos antigos ao criar um novo
codigoBarrasSchema.pre('save', async function(next) {
    if (this.isNew && this.ativo) {
        await this.constructor.updateMany(
            { 
                produtoId: this.produtoId, 
                ativo: true, 
                _id: { $ne: this._id } 
            },
            { 
                ativo: false, 
                dataDesativacao: new Date() 
            }
        );
    }
    next();
});

// Métodos estáticos
codigoBarrasSchema.statics.buscarPorCodigo = function(codigo) {
    return this.findOne({ codigo, ativo: true }).populate('produtoId');
};

codigoBarrasSchema.statics.obterCodigoAtivo = function(produtoId) {
    return this.findOne({ produtoId, ativo: true });
};

module.exports = mongoose.model('CodigoBarras', codigoBarrasSchema);
