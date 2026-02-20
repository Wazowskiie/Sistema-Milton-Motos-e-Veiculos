const Alerta = require('../../models/Alerta');
const Produto = require('../../models/Produto');

class AlertaService {
  static async criar(dados) {
    if (!dados.titulo || !dados.mensagem) {
      throw new Error('Título e mensagem são obrigatórios');
    }
    return Alerta.create(dados);
  }

  static async listar() {
    return Alerta.find().sort({ createdAt: -1 });
  }

  static async verificarEstoqueMinimo(limite = 5) {
    const produtos = await Produto.find({ estoque: { $lte: limite } });
    if (!produtos.length) return [];

    const alertas = produtos.map(p => ({
      titulo: 'Estoque baixo',
      mensagem: `Produto ${p.nome} com estoque ${p.estoque}`
    }));

    return Alerta.insertMany(alertas);
  }

  static async marcarComoLido(id) {
    const alerta = await Alerta.findByIdAndUpdate(
      id,
      { lido: true },
      { new: true }
    );
    if (!alerta) throw new Error('Alerta não encontrado');
    return alerta;
  }
}

module.exports = AlertaService;
