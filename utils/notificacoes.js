const notificacaoUtils = {
  async enviarWhatsApp(numero, mensagem) {
    // Integração com API do WhatsApp Business
    // Exemplo usando Twilio ou similar
    try {
      console.log(`WhatsApp para ${numero}: ${mensagem}`);
      // Implementar integração real aqui
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { sucesso: false, erro: error.message };
    }
  },
  
  async notificarRevisaoPendente(cliente, proximaRevisao) {
    const diasRestantes = Math.ceil((proximaRevisao - new Date()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 7 && diasRestantes > 0) {
      const mensagem = `Olá ${cliente.nome}! Sua moto está próxima da revisão programada (${diasRestantes} dias). Agende já pelo WhatsApp!`;
      
      if (cliente.whatsapp) {
        await this.enviarWhatsApp(cliente.whatsapp, mensagem);
      }
    }
  },
  
  async notificarPecaChegou(cliente, nomePeca) {
    const mensagem = `${cliente.nome}, a peça "${nomePeca}" que você estava aguardando chegou! Venha buscar ou agende a instalação.`;
    
    if (cliente.whatsapp) {
      await this.enviarWhatsApp(cliente.whatsapp, mensagem);
    }
  },
  
  async notificarOrcamentoProto(cliente, valorTotal, numero) {
    const mensagem = `Orçamento ${numero} pronto! Valor total: R$ ${valorTotal.toFixed(2)}. Válido por 15 dias. Dúvidas? Entre em contato!`;
    
    if (cliente.whatsapp) {
      await this.enviarWhatsApp(cliente.whatsapp, mensagem);
    }
  }
};