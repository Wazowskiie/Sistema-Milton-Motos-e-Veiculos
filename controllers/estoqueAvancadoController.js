// controllers/estoqueAvancadoController.js
const Produto = require('../models/Produto');   // <-- faltava
// const Estoque = require('../models/Estoque'); // use se realmente precisar

const estoqueAvancadoController = {
  // Alertas de estoque baixo
  async alertasEstoque(req, res) {
    try {
      const produtosBaixoEstoque = await Produto.find({
        $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] },
        ativo: true
      }).populate('fornecedor');

      const produtosZerados = await Produto.find({
        estoqueAtual: 0,
        ativo: true
      });

      const sugestoesPedido = await Promise.all(
        produtosBaixoEstoque.map(async (produto) => {
          const vendaMedia = await this.calcularVendaMedia(produto._id);
          const quantidadeSugerida = Math.max(
            (produto.estoqueMaximo ?? 0) - (produto.estoqueAtual ?? 0),
            vendaMedia * 30 // 30 dias de estoque
          );

          return {
            produto: produto.nome,
            codigo: produto.codigo,
            estoqueAtual: produto.estoqueAtual,
            estoqueMinimo: produto.estoqueMinimo,
            quantidadeSugerida,
            fornecedor: produto.fornecedor?.nome,
            contatoFornecedor: produto.fornecedor?.contato,
            valorEstimado: quantidadeSugerida * (produto.precoCusto ?? 0)
          };
        })
      );

      res.json({
        alertas: {
          produtosBaixoEstoque: produtosBaixoEstoque.length,
          produtosZerados: produtosZerados.length,
          valorTotalPedidos: sugestoesPedido.reduce((sum, item) => sum + (item.valorEstimado ?? 0), 0)
        },
        sugestoesPedido,
        produtosZerados: produtosZerados.map(p => ({
          nome: p.nome,
          codigo: p.codigo,
          ultimaVenda: p.ultimaVenda,
          fornecedor: p.fornecedor?.nome
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Calcular média de vendas (stub)
  async calcularVendaMedia(produtoId, dias = 30) {
    const _dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
    // TODO: consultar coleção de vendas
    return Math.floor(Math.random() * 5) + 1;
  },

  // Localização física dos produtos
  async mapearLocalizacao(req, res) {
    try {
      const produtos = await Produto.find({
        ativo: true,
        'localizacao.corredor': { $exists: true }
      }).select('nome codigo localizacao estoqueAtual');

      const mapa = produtos.reduce((acc, produto) => {
        const corredor = produto.localizacao.corredor;
        if (!acc[corredor]) acc[corredor] = {};

        const prateleira = produto.localizacao.prateleira;
        if (!acc[corredor][prateleira]) acc[corredor][prateleira] = [];

        acc[corredor][prateleira].push({
          nome: produto.nome,
          codigo: produto.codigo,
          posicao: produto.localizacao.posicao,
          estoque: produto.estoqueAtual
        });
        return acc;
      }, {});

      res.json({
        mapaEstoque: mapa,
        estatisticas: {
          totalProdutos: produtos.length,
          corredoresOcupados: Object.keys(mapa).length,
          produtosSemLocalizacao: await Produto.countDocuments({
            ativo: true,
            'localizacao.corredor': { $exists: false }
          })
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Histórico de preços
  async historicoPrecos(req, res) {
    try {
      const { produtoId } = req.params;
      const meses = Number(req.query.meses ?? 12);

      const produto = await Produto.findById(produtoId);
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

      const historicoArr = Array.isArray(produto.historicoPrecos) ? produto.historicoPrecos : [];
      const dataLimite = new Date(Date.now() - meses * 30 * 24 * 60 * 60 * 1000);

      const historico = historicoArr
        .filter(h => new Date(h.data) >= dataLimite)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

      const variacao = historico.length > 1
        ? (((historico.at(-1).preco - historico[0].preco) / historico[0].preco) * 100).toFixed(2)
        : 0;

      res.json({
        produto: {
          nome: produto.nome,
          codigo: produto.codigo,
          precoAtual: produto.precoVenda
        },
        historico,
        analise: {
          variacaoPercentual: Number(variacao),
          precoMinimo: historico.length ? Math.min(...historico.map(h => h.preco)) : null,
          precoMaximo: historico.length ? Math.max(...historico.map(h => h.preco)) : null,
          totalAlteracoes: historico.length
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

// **Agora exporta de verdade**
module.exports = estoqueAvancadoController;
