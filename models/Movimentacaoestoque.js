const mongoose = require('mongoose');

const movimentacaoSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  produtoNome: String, // Cache para histórico
  tipo: {
    type: String,
    enum: ['entrada', 'saida', 'ajuste'],
    required: true
  },
  quantidade: {
    type: Number,
    required: true
  },
  estoqueAnterior: {
    type: Number,
    required: true
  },
  estoqueAtual: {
    type: Number,
    required: true
  },
  motivo: {
    type: String,
    enum: ['compra', 'venda', 'ajuste', 'perda', 'devolucao', 'outro'],
    default: 'outro'
  },
  observacao: String,
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  data: {
    type: Date,
    default: Date.now
  },
  documento: String, // Número da venda, nota fiscal, etc.
  valorUnitario: Number // Para controle de custos
});

// Índices para consultas rápidas
movimentacaoSchema.index({ produto: 1, data: -1 });
movimentacaoSchema.index({ tipo: 1, data: -1 });

module.exports = mongoose.model('MovimentacaoEstoque', movimentacaoSchema);

// controllers/estoqueController.js - ATUALIZADO
const Produto = require('../models/Produto');
const MovimentacaoEstoque = require('../models/Movimentacaoestoque');

const estoqueController = {
  async entrada(req, res) {
    try {
      const { produtoId, quantidade, observacao, precoCusto, motivo = 'compra' } = req.body;
      
      const produto = await Produto.findById(produtoId);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      const estoqueAnterior = produto.estoqueAtual;
      produto.estoqueAtual += parseInt(quantidade);
      
      // Atualizar preço de custo se fornecido
      if (precoCusto) {
        produto.precoCusto = precoCusto;
        produto.historicoPrecos.push({
          preco: precoCusto,
          motivo: 'Entrada de estoque'
        });
      }
      
      produto.dataUltimaCompra = new Date();
      await produto.save();
      
      // Registrar movimentação
      const movimentacao = new MovimentacaoEstoque({
        produto: produtoId,
        produtoNome: produto.nome,
        tipo: 'entrada',
        quantidade: parseInt(quantidade),
        estoqueAnterior,
        estoqueAtual: produto.estoqueAtual,
        motivo,
        observacao,
        valorUnitario: precoCusto
      });
      
      await movimentacao.save();
      
      res.json({
        message: 'Entrada de estoque realizada com sucesso',
        produto: {
          nome: produto.nome,
          codigo: produto.codigo,
          estoqueAnterior,
          estoqueAtual: produto.estoqueAtual,
          quantidadeAdicionada: parseInt(quantidade)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async saida(req, res) {
    try {
      const { produtoId, quantidade, motivo = 'venda', observacao } = req.body;
      
      const produto = await Produto.findById(produtoId);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      if (produto.estoqueAtual < parseInt(quantidade)) {
        return res.status(400).json({ 
          error: 'Estoque insuficiente',
          estoqueDisponivel: produto.estoqueAtual,
          quantidadeSolicitada: parseInt(quantidade)
        });
      }
      
      const estoqueAnterior = produto.estoqueAtual;
      produto.estoqueAtual -= parseInt(quantidade);
      produto.dataUltimaVenda = new Date();
      await produto.save();
      
      // Registrar movimentação
      const movimentacao = new MovimentacaoEstoque({
        produto: produtoId,
        produtoNome: produto.nome,
        tipo: 'saida',
        quantidade: parseInt(quantidade),
        estoqueAnterior,
        estoqueAtual: produto.estoqueAtual,
        motivo,
        observacao
      });
      
      await movimentacao.save();
      
      res.json({
        message: 'Saída de estoque realizada com sucesso',
        produto: {
          nome: produto.nome,
          codigo: produto.codigo,
          estoqueAnterior,
          estoqueAtual: produto.estoqueAtual,
          quantidadeRetirada: parseInt(quantidade),
          motivo
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async ajuste(req, res) {
    try {
      const { produtoId, novaQuantidade, motivo = 'ajuste', observacao } = req.body;
      
      const produto = await Produto.findById(produtoId);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      const estoqueAnterior = produto.estoqueAtual;
      const diferenca = parseInt(novaQuantidade) - estoqueAnterior;
      
      produto.estoqueAtual = parseInt(novaQuantidade);
      await produto.save();
      
      // Registrar movimentação
      const movimentacao = new MovimentacaoEstoque({
        produto: produtoId,
        produtoNome: produto.nome,
        tipo: 'ajuste',
        quantidade: Math.abs(diferenca),
        estoqueAnterior,
        estoqueAtual: produto.estoqueAtual,
        motivo,
        observacao
      });
      
      await movimentacao.save();
      
      res.json({
        message: 'Ajuste de estoque realizado com sucesso',
        produto: {
          nome: produto.nome,
          codigo: produto.codigo,
          estoqueAnterior,
          estoqueAtual: produto.estoqueAtual,
          diferenca,
          motivo
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async relatorioMovimentacao(req, res) {
    try {
      const { dataInicio, dataFim, tipo, produtoId } = req.query;
      
      const filtros = {};
      
      if (dataInicio && dataFim) {
        filtros.data = {
          $gte: new Date(dataInicio),
          $lte: new Date(dataFim)
        };
      }
      
      if (tipo) filtros.tipo = tipo;
      if (produtoId) filtros.produto = produtoId;
      
      const movimentacoes = await MovimentacaoEstoque.find(filtros)
        .populate('produto', 'nome codigo')
        .populate('usuario', 'nome')
        .sort({ data: -1 })
        .limit(1000);
      
      res.json(movimentacoes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async inventario(req, res) {
    try {
      const produtos = await Produto.find({ ativo: true })
        .select('nome codigo categoria estoqueAtual estoqueMinimo precoCusto precoVenda localizacao')
        .sort({ categoria: 1, nome: 1 });
      
      const valorTotal = produtos.reduce((total, produto) => {
        const valorProduto = produto.estoqueAtual * (produto.precoCusto || produto.precoVenda * 0.7);
        return total + valorProduto;
      }, 0);
      
      res.json({
        produtos,
        resumo: {
          totalProdutos: produtos.length,
          valorTotalEstoque: valorTotal,
          produtosBaixoEstoque: produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).length,
          produtosZerados: produtos.filter(p => p.estoqueAtual === 0).length
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = estoqueController;