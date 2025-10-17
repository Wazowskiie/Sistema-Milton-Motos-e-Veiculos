const rotinasAutomaticas = {
  async verificarEstoqueBaixo() {
    try {
      const produtosBaixoEstoque = await Produto.find({
        $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] },
        ativo: true
      });
      
      if (produtosBaixoEstoque.length > 0) {
        console.log(`⚠️  ${produtosBaixoEstoque.length} produtos com estoque baixo:`);
        produtosBaixoEstoque.forEach(p => {
          console.log(`- ${p.nome}: ${p.estoqueAtual} unidades`);
        });
        
        // Aqui você pode implementar notificação para o gestor
      }
      
      return produtosBaixoEstoque;
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
    }
  },
  
  async lembreteRevisoes() {
    try {
      const proximasRevisoes = await Cliente.find({
        'historicoServicos.proximaRevisao': {
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 dias
          $gte: new Date()
        },
        ativo: true
      });
      
      for (const cliente of proximasRevisoes) {
        for (const servico of cliente.historicoServicos) {
          if (servico.proximaRevisao && servico.proximaRevisao <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
            await notificacaoUtils.notificarRevisaoPendente(cliente, servico.proximaRevisao);
          }
        }
      }
      
      return proximasRevisoes.length;
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
    }
  },
  
  async backup() {
    // Implementar rotina de backup automático
    console.log('🔄 Executando backup automático...');
    // Usar mongodump ou similar
  }
};

module.exports = {
  dashboardController,
  agendamentoController,
  integracaoController,
  relatorioController,
  validacaoMiddleware,
  notificacaoUtils,
  rotinasAutomaticas
};