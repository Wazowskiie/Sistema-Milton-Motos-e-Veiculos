const Produto = require('../models/Produto');

class ProdutoService {
  static async criar(dados) {
    if (!dados.nome) {
      throw new Error('Nome do produto é obrigatório');
    }

    return Produto.create(dados);
  }

  static async listar() {
    return Produto.find().sort({ createdAt: -1 });
  }

  static async buscarPorId(id) {
    const produto = await Produto.findById(id);
    if (!produto) throw new Error('Produto não encontrado');
    return produto;
  }

  static async atualizar(id, dados) {
    const produto = await Produto.findByIdAndUpdate(id, dados, { new: true });
    if (!produto) throw new Error('Produto não encontrado');
    return produto;
  }

  static async excluir(id) {
    const produto = await Produto.findByIdAndDelete(id);
    if (!produto) throw new Error('Produto não encontrado');
    return produto;
  }
}

module.exports = ProdutoService;
