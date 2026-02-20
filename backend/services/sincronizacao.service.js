const LogSincronizacao = require('../../models/LogSincronizacao');

class SincronizacaoService {
  static async registrar(tipo, status, mensagem) {
    return LogSincronizacao.create({
      tipo,
      status,
      mensagem
    });
  }

  static async listar() {
    return LogSincronizacao.find().sort({ createdAt: -1 });
  }
}

module.exports = SincronizacaoService;
