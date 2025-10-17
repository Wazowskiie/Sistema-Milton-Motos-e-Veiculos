const mongoose = require('mongoose');

const integracaoFornecedorSchema = new mongoose.Schema({
    fornecedorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fornecedor',
        required: true,
        index: true
    },
    nome: {
        type: String,
        required: true,
        maxlength: 100
    },
    tipo: {
        type: String,
        enum: ['api', 'xml', 'csv', 'json', 'email', 'ftp', 'webhook'],
        required: true
    },
    configuracao: {
        // Para API REST
        url: String,
        metodo: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'PATCH'],
            default: 'GET'
        },
        headers: mongoose.Schema.Types.Mixed,
        parametros: mongoose.Schema.Types.Mixed,
        autenticacao: {
            tipo: {
                type: String,
                enum: ['none', 'basic', 'bearer', 'api_key', 'oauth']
            },
            credenciais: mongoose.Schema.Types.Mixed
        },
        
        // Para arquivos (CSV/XML/JSON)
        caminho: String,
        delimitador: String,
        encoding: {
            type: String,
            default: 'utf8'
        },
        
        // Para email
        servidor: String,
        porta: Number,
        ssl: Boolean,
        usuario: String,
        senha: String,
        pasta: String,
        
        // Mapeamento de campos
        mapeamentoCampos: {
            sku: String,
            nome: String,
            preco: String,
            quantidade: String,
            categoria: String,
            descricao: String,
            codigoFornecedor: String,
            codigoBarras: String,
            peso: String,
            dimensoes: String,
            ativo: String
        },
        
        // Configurações de filtros
        filtros: {
            apenasAtivos: {
                type: Boolean,
                default: true
            },
            categorias: [String],
            precoMinimo: Number,
            precoMaximo: Number
        }
    },
    frequenciaSincronizacao: {
        type: String,
        enum: ['manual', 'tempo_real', 'horaria', 'diaria', 'semanal', 'mensal'],
        default: 'diaria'
    },
    horarioSincronizacao: {
        type: String, // Formato: "HH:MM"
        default: "02:00"
    },
    ativo: {
        type: Boolean,
        default: true,
        index: true
    },
    status: {
        type: String,
        enum: ['configurado', 'testando', 'ativo', 'sincronizando', 'erro', 'pausado'],
        default: 'configurado',
        index: true
    },
    ultimaSincronizacao: {
        data: Date,
        status: {
            type: String,
            enum: ['sucesso', 'erro', 'parcial']
        },
        registrosProcessados: Number,
        registrosAtualizados: Number,
        registrosCriados: Number,
        registrosErro: Number,
        tempoExecucao: Number, // em segundos
        mensagem: String,
        detalhes: mongoose.Schema.Types.Mixed
    },
    proximaSincronizacao: {
        type: Date,
        index: true
    },
    estatisticas: {
        totalSincronizacoes: {
            type: Number,
            default: 0
        },
        sucessos: {
            type: Number,
            default: 0
        },
        erros: {
            type: Number,
            default: 0
        },
        tempoMedioExecucao: {
            type: Number,
            default: 0
        },
        ultimoErro: {
            data: Date,
            mensagem: String,
            stack: String
        }
    },
    configuracoesTecnicas: {
        timeout: {
            type: Number,
            default: 30000 // 30 segundos
        },
        tentativas: {
            type: Number,
            default: 3
        },
        intervaloTentativas: {
            type: Number,
            default: 5000 // 5 segundos
        },
        tamanhoBatch: {
            type: Number,
            default: 100
        }
    },
    notificacoes: {
        email: [String],
        webhook: String,
        notificarSucesso: {
            type: Boolean,
            default: false
        },
        notificarErro: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true,
    collection: 'integracoes_fornecedores'
});

// Índices compostos
integracaoFornecedorSchema.index({ fornecedorId: 1, ativo: 1 });
integracaoFornecedorSchema.index({ status: 1, ativo: 1 });
integracaoFornecedorSchema.index({ proximaSincronizacao: 1, ativo: 1 });

// Virtual para taxa de sucesso
integracaoFornecedorSchema.virtual('taxaSucesso').get(function() {
    if (this.estatisticas.totalSincronizacoes === 0) return 0;
    return ((this.estatisticas.sucessos / this.estatisticas.totalSincronizacoes) * 100).toFixed(2);
});

// Middleware para calcular próxima sincronização
integracaoFornecedorSchema.pre('save', function(next) {
    if (this.isModified('frequenciaSincronizacao') || this.isModified('horarioSincronizacao')) {
        this.proximaSincronizacao = this.calcularProximaSincronizacao();
    }
    next();
});

// Métodos de instância
integracaoFornecedorSchema.methods.calcularProximaSincronizacao = function() {
    const agora = new Date();
    
    switch (this.frequenciaSincronizacao) {
        case 'manual':
            return null;
        case 'tempo_real':
            return new Date(agora.getTime() + 60000); // 1 minuto
        case 'horaria':
            const proximaHora = new Date(agora);
            proximaHora.setHours(proximaHora.getHours() + 1, 0, 0, 0);
            return proximaHora;
        case 'diaria':
            const [hora, minuto] = this.horarioSincronizacao.split(':');
            const proximoDia = new Date(agora);
            proximoDia.setDate(proximoDia.getDate() + 1);
            proximoDia.setHours(parseInt(hora), parseInt(minuto), 0, 0);
            return proximoDia;
        case 'semanal':
            const proximaSemana = new Date(agora);
            proximaSemana.setDate(proximaSemana.getDate() + 7);
            return proximaSemana;
        case 'mensal':
            const proximoMes = new Date(agora);
            proximoMes.setMonth(proximoMes.getMonth() + 1);
            return proximoMes;
        default:
            return new Date(agora.getTime() + 24 * 60 * 60 * 1000); // 24 horas
    }
};

integracaoFornecedorSchema.methods.registrarSincronizacao = function(resultado) {
    this.ultimaSincronizacao = {
        data: new Date(),
        status: resultado.status,
        registrosProcessados: resultado.processados || 0,
        registrosAtualizados: resultado.atualizados || 0,
        registrosCriados: resultado.criados || 0,
        registrosErro: resultado.erros || 0,
        tempoExecucao: resultado.tempoExecucao || 0,
        mensagem: resultado.mensagem,
        detalhes: resultado.detalhes
    };
    
    this.estatisticas.totalSincronizacoes += 1;
    if (resultado.status === 'sucesso') {
        this.estatisticas.sucessos += 1;
    } else {
        this.estatisticas.erros += 1;
        this.estatisticas.ultimoErro = {
            data: new Date(),
            mensagem: resultado.mensagem,
            stack: resultado.stack
        };
    }
    
    // Atualizar tempo médio de execução
    const totalTempo = this.estatisticas.tempoMedioExecucao * (this.estatisticas.totalSincronizacoes - 1);
    this.estatisticas.tempoMedioExecucao = (totalTempo + resultado.tempoExecucao) / this.estatisticas.totalSincronizacoes;
    
    this.proximaSincronizacao = this.calcularProximaSincronizacao();
    
    return this.save();
};

// Métodos estáticos
integracaoFornecedorSchema.statics.obterPendentes = function() {
    return this.find({
        ativo: true,
        status: { $in: ['ativo', 'configurado'] },
        proximaSincronizacao: { $lte: new Date() },
        frequenciaSincronizacao: { $ne: 'manual' }
    }).populate('fornecedorId', 'nome cnpj');
};

integracaoFornecedorSchema.statics.obterPorFornecedor = function(fornecedorId) {
    return this.find({ fornecedorId, ativo: true })
        .populate('fornecedorId', 'nome cnpj email');
};

module.exports = mongoose.model('IntegracaoFornecedor', integracaoFornecedorSchema);