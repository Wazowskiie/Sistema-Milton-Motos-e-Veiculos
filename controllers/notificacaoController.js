const notificacaoController = {
  async listarNotificacoes(req, res) {
    try {
      // Simular notificações do sistema
      const notificacoes = [
        {
          _id: '1',
          tipo: 'estoque',
          mensagem: '3 produtos com estoque baixo',
          data: new Date(),
          lida: false
        },
        {
          _id: '2',
          tipo: 'revisao',
          mensagem: '5 clientes com revisão pendente',
          data: new Date(Date.now() - 86400000),
          lida: false
        }
      ];
      
      res.json(notificacoes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async marcarComoLida(req, res) {
    try {
      const { id } = req.params;
      // Implementar lógica para marcar notificação como lida
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = notificacaoController;