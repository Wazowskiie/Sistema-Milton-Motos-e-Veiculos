const Produto = require('../models/Produto');
const Venda = require('../models/Venda');
// Opcional: registre movimento de estoque, se existir
let Movimento;
try { Movimento = require('../models/Movimento'); } catch {}

function toNumber(val){
  if (typeof val === 'string') return Number(val.replace(',', '.'));
  return Number(val);
}

module.exports = {
  async criar(req, res) {
    try {
      let { cliente, produtoId, quantidade, precoUnitario, observacao } = req.body;

      quantidade    = toNumber(quantidade);
      precoUnitario = toNumber(precoUnitario);

      const produto = await Produto.findById(produtoId);
      if (!produto || produto.ativo === false) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const estoqueAtual = Number(produto.estoqueAtual ?? 0);
      if (quantidade > estoqueAtual) {
        return res.status(400).json({ error: 'Estoque insuficiente' });
      }

      const venda = await Venda.create({
        cliente, produto: produto._id, quantidade, precoUnitario, observacao
      });

      // Atualiza estoque e estatísticas do produto
      produto.estoqueAtual = estoqueAtual - quantidade;
      produto.quantidadeVendida = (produto.quantidadeVendida ?? 0) + quantidade;
      produto.ultimaVenda = new Date();
      await produto.save();

      // Registra movimento (se o modelo existir)
      if (Movimento) {
        await Movimento.create({
          tipo: 'SAIDA',
          produto: produto._id,
          quantidade,
          motivo: 'Venda',
          referencia: venda._id,
          data: new Date()
        });
      }

      res.status(201).json({ message: 'Venda registrada', venda });
    } catch (e) {
      res.status(400).json({ error: 'Erro ao registrar venda', detalhes: e.message });
    }
  },

  async listar(req, res) {
    const vendas = await Venda.find().sort({ data: -1 }).populate('produto', 'codigo nome');
    res.json(vendas);
  },

  async buscarPorId(req, res) {
    const v = await Venda.findById(req.params.id).populate('produto', 'codigo nome');
    if (!v) return res.status(404).json({ error: 'Venda não encontrada' });
    res.json(v);
  },

  async deletar(req, res) {
    const v = await Venda.findByIdAndDelete(req.params.id);
    if (!v) return res.status(404).json({ error: 'Venda não encontrada' });
    res.json({ success: true });
  }
};
