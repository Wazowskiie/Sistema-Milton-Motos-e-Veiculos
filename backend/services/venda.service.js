const Venda = require('../models/Venda');
const Produto = require('../models/Produto');

class VendaService {
  static async registrar(dados) {
    const produto = await Produto.findById(dados.produtoId);

    if (!produto) throw new Error('Produto não encontrado');
    if (produto.estoque < dados.quantidade) {
      throw new Error('Estoque insuficiente');
    }

    produto.estoque -= dados.quantidade;
    await produto.save();

    return Venda.create({
      produto: produto._id,
      quantidade: dados.quantidade,
      valor: dados.valor
    });
  }

  static async listar() {
    return Venda.find()
      .populate('produto')
      .sort({ createdAt: -1 });
  }
}

module.exports = VendaService;
