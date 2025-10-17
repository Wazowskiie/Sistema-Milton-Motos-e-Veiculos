const mongoose = require('mongoose');

const logSincronizacaoSchema = new mongoose.Schema({
    integracaoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IntegracaoFornecedor',
        required: true,
        index: true
    },
    fornecedorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fornecedor',
        required: true,
        index: true
    },
    dataInicio: {
        type: Date,
        required: true,
        index: true
    },
    dataFim: {
        type: Date
    },
    status: {
        type: String,
        enum: ['iniciado', 'processando', 'sucesso', 'erro', 'cancelado'],
        required: true,
        index: true
    },
    tipoSincronizacao: {
        type: String,
        enum: ['automatica', 'manual', 'agendada'],
        default: 'manual'
    },
    resultados: {
        registrosLidos: {
            type: Number,
            default: 0
        },
        registrosProcessados: {
            type: Number,
            default: 0
        },
        registrosAtualizados: {
            type: Number,
            default: 0
        },
        registrosCriados: {
            type: Number,
            default: 0
        },
        registrosIgnorados: {
            type: Number,
            default: 0
        },
        registrosErro: {
            type: Number,
            default: 0
        }
    },
    tempoExecucao: {
        type: Number, // em segundos
        default: 0
    },
    memoria: {
        inicial: Number,
        final: Number,
        pico: Number
    },
    mensagem: {
        type: String
    },
    detalhesErro: {
        tipo: String,
        mensagem: String,
        stack: String,
        linha: Number
    },
    arquivos: [{
        nome: String,
        tamanho: Number,
        checksum: String,
        url: String
    }],
    dadosEstatisticos: {
        velocidadeProcessamento: Number, // registros por segundo
        throughput: Number, // KB por segundo
        memoriaMedia: Number
    },
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    timestamps: true,
    collection: 'logs_sincronizacao'
});

// Índices compostos
logSincronizacaoSchema.index({ integracaoId: 1, dataInicio: -1 });
logSincronizacaoSchema.index({ fornecedorId: 1, status: 1 });
logSincronizacaoSchema.index({ dataInicio: -1, status: 1 });

// Virtual para duração em formato legível
logSincronizacaoSchema.virtual('duracaoFormatada').get(function() {
    if (!this.tempoExecucao) return '0s';
    
    const segundos = this.tempoExecucao;
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = segundos % 60;
    
    if (horas > 0) return `${horas}h ${minutos}m ${seg}s`;
    if (minutos > 0) return `${minutos}m ${seg}s`;
    return `${seg}s`;
});

// Métodos de instância
logSincronizacaoSchema.methods.finalizarLog = function(resultados, erro = null) {
    this.dataFim = new Date();
    this.tempoExecucao = (this.dataFim - this.dataInicio) / 1000;
    
    if (erro) {
        this.status = 'erro';
        this.detalhesErro = {
            tipo: erro.name,
            mensagem: erro.message,
            stack: erro.stack
        };
        this.mensagem = erro.message;
    } else {
        this.status = 'sucesso';
        this.resultados = resultados;
        this.mensagem = `Sincronização concluída: ${resultados.registrosProcessados} registros processados`;
    }
    
    // Calcular estatísticas
    if (this.tempoExecucao > 0) {
        this.dadosEstatisticos = {
            velocidadeProcessamento: this.resultados.registrosProcessados / this.tempoExecucao
        };
    }
    
    return this.save();
};

// Métodos estáticos
logSincronizacaoSchema.statics.obterUltimosLogs = function(integracaoId, limite = 20) {
    return this.find({ integracaoId })
        .populate('usuarioId', 'nome')
        .sort({ dataInicio: -1 })
        .limit(limite);
};

logSincronizacaoSchema.statics.estatisticasPorPeriodo = function(dataInicio, dataFim) {
    return this.aggregate([
        {
            $match: {
                dataInicio: { $gte: dataInicio, $lte: dataFim }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                tempoMedio: { $avg: '$tempoExecucao' },
                registrosTotais: { $sum: '$resultados.registrosProcessados' }
            }
        }
    ]);
};

module.exports = mongoose.model('LogSincronizacao', logSincronizacaoSchema);