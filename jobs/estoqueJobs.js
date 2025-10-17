const cron = require('node-cron');
const notificacaoEstoqueService = require('../services/notificacaoEstoqueService');
const sincronizacaoService = require('../services/sincronizacaoService');
const codigoBarrasService = require('../services/codigoBarrasService');

class EstoqueJobs {
    iniciarJobs() {
        // Verificar estoque baixo diariamente às 8h
        cron.schedule('0 8 * * *', async () => {
            console.log('🕐 Executando verificação de estoque baixo...');
            try {
                await notificacaoEstoqueService.verificarEstoqueBaixo();
            } catch (error) {
                console.error('Erro na verificação de estoque baixo:', error.message);
            }
        });

        // Verificar variações de preço diariamente às 18h
        cron.schedule('0 18 * * *', async () => {
            console.log('🕐 Executando verificação de variações de preço...');
            try {
                await notificacaoEstoqueService.verificarVariacoesPreco();
            } catch (error) {
                console.error('Erro na verificação de variações de preço:', error.message);
            }
        });

        // Limpeza de logs antigos semanalmente
        cron.schedule('0 2 * * 0', async () => {
            console.log('🕐 Executando limpeza de logs antigos...');
            try {
                const LogSincronizacao = require('../models/LogSincronizacao');
                const dataLimite = new Date();
                dataLimite.setMonth(dataLimite.getMonth() - 3); // 3 meses

                const resultado = await LogSincronizacao.deleteMany({
                    dataInicio: { $lt: dataLimite }
                });

                console.log(`🗑️ ${resultado.deletedCount} logs antigos removidos`);
            } catch (error) {
                console.error('Erro na limpeza de logs:', error.message);
            }
        });

        console.log('⏰ Jobs de estoque agendados com sucesso');
    }

    pararJobs() {
        cron.destroy();
        console.log('⏹️ Jobs de estoque parados');
    }
}

module.exports = new EstoqueJobs();