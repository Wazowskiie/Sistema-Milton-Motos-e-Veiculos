const Produto = require('../models/Produto');

class EstoqueService {
  static async adicionar(produtoId, quantidade) {
    const produto = await Produto.findById(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    produto.estoque += quantidade;
    await produto.save();

    return produto;
  }

  static async remover(produtoId, quantidade) {
    const produto = await Produto.findById(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    if (produto.estoque < quantidade) {
      throw new Error('Estoque insuficiente');
    }

    produto.estoque -= quantidade;
    await produto.save();

    return produto;
  }
}

module.exports = EstoqueService;
