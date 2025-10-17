const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
const LogSincronizacao = require('../models/LogSincronizacao');
const IntegracaoFornecedorController = require('../controllers/integracaoFornecedorController');

class SincronizacaoService {
    constructor() {
        this.intervalos = new Map();
    }

    // Iniciar sincronizações automáticas
    iniciarSincronizacaoAutomatica() {
        console.log('🔄 Iniciando serviço de sincronização automática...');
        
        // Verificar integrações pendentes a cada 5 minutos
        this.intervaloVerificacao = setInterval(() => {
            this.verificarSincronizacoesPendentes();
        }, 5 * 60 * 1000);

        // Executar verificação inicial
        setTimeout(() => {
            this.verificarSincronizacoesPendentes();
        }, 10000);
    }

    // Parar sincronizações automáticas
    pararSincronizacaoAutomatica() {
        console.log('⏹️ Parando serviço de sincronização automática...');
        
        if (this.intervaloVerificacao) {
            clearInterval(this.intervaloVerificacao);
        }

        // Parar todos os intervalos individuais
        this.intervalos.forEach(intervalo => {
            clearInterval(intervalo);
        });
        this.intervalos.clear();
    }

    // Verificar e executar sincronizações pendentes
    async verificarSincronizacoesPendentes() {
        try {
            const integracoesPendentes = await IntegracaoFornecedor.obterPendentes();
            
            console.log(`📊 Encontradas ${integracoesPendentes.length} integrações pendentes`);

            for (const integracao of integracoesPendentes) {
                await this.executarSincronizacao(integracao);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar sincronizações pendentes:', error.message);
        }
    }

    // Executar sincronização individual
    async executarSincronizacao(integracao) {
        const logSincronizacao = new LogSincronizacao({
            integracaoId: integracao._id,
            fornecedorId: integracao.fornecedorId,
            dataInicio: new Date(),
            status: 'iniciado',
            tipoSincronizacao: 'automatica'
        });

        try {
            await logSincronizacao.save();
            
            console.log(`🔄 Iniciando sincronização: ${integracao.fornecedorId.nome}`);

            // Atualizar status da integração
            await IntegracaoFornecedor.findByIdAndUpdate(integracao._id, {
                status: 'sincronizando'
            });

            const resultado = await this.executarSincronizacaoTipo(integracao);
            
            // Registrar sucesso
            await integracao.registrarSincronizacao({
                status: 'sucesso',
                ...resultado,
                tempoExecucao: (new Date() - logSincronizacao.dataInicio) / 1000
            });

            await logSincronizacao.finalizarLog(resultado);

            console.log(`✅ Sincronização concluída: ${integracao.fornecedorId.nome} - ${resultado.processados} registros`);

        } catch (error) {
            console.error(`❌ Erro na sincronização ${integracao.fornecedorId.nome}:`, error.message);

            // Registrar erro
            await integracao.registrarSincronizacao({
                status: 'erro',
                mensagem: error.message,
                stack: error.stack,
                tempoExecucao: (new Date() - logSincronizacao.dataInicio) / 1000
            });

            await logSincronizacao.finalizarLog(null, error);
        }
    }

    // Executar sincronização baseada no tipo
    async executarSincronizacaoTipo(integracao) {
        const controller = IntegracaoFornecedorController;
        
        switch (integracao.tipo) {
            case 'api':
                return await controller.sincronizarAPI(integracao);
            case 'xml':
                return await controller.sincronizarXML(integracao);
            case 'csv':
                return await controller.sincronizarCSV(integracao);
            default:
                throw new Error(`Tipo de integração não suportado: ${integracao.tipo}`);
        }
    }

    // Agendar sincronização específica
    agendarSincronizacao(integracaoId, intervalo) {
        if (this.intervalos.has(integracaoId)) {
            clearInterval(this.intervalos.get(integracaoId));
        }

        const intervalObj = setInterval(async () => {
            try {
                const integracao = await IntegracaoFornecedor.findById(integracaoId)
                    .populate('fornecedorId');
                
                if (integracao && integracao.ativo) {
                    await this.executarSincronizacao(integracao);
                } else {
                    this.cancelarAgendamento(integracaoId);
                }
            } catch (error) {
                console.error(`Erro no agendamento ${integracaoId}:`, error.message);
            }
        }, intervalo);

        this.intervalos.set(integracaoId, intervalObj);
    }

    // Cancelar agendamento
    cancelarAgendamento(integracaoId) {
        if (this.intervalos.has(integracaoId)) {
            clearInterval(this.intervalos.get(integracaoId));
            this.intervalos.delete(integracaoId);
        }
    }

    // Obter estatísticas do serviço
    obterEstatisticas() {
        return {
            agendamentosAtivos: this.intervalos.size,
            servicoAtivo: !!this.intervaloVerificacao,
            ultimaVerificacao: new Date()
        };
    }
}

module.exports = new SincronizacaoService();