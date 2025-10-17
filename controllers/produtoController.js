// controllers/produtoController.js
const Produto = require('../models/Produto');

// ---- helpers ----
function normalizarCategoria(categoria) {
  if (!categoria || typeof categoria !== 'string') return undefined;
  const norm = categoria.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const mapa = {
    motor: 'motor',
    freio: 'freio',
    suspensao: 'suspensao',
    eletrica: 'eletrica',
    carroceria: 'carroceria',
    transmissao: 'transmissao',
    pneus: 'pneus',
    outros: 'outros',
  };
  return mapa[norm] || 'outros';
}

function normalizarProduto(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const precoVenda = Number(o.precoVenda ?? o.preco ?? 0);
  const estoqueAtual = Number(o.estoqueAtual ?? o.quantidade ?? o.estoque ?? 0);
  const estoqueMinimo = Number(o.estoqueMinimo ?? 0);
  const status = estoqueAtual <= estoqueMinimo ? 'Baixo' : 'OK';
  return { ...o, precoVenda, estoqueAtual, estoqueMinimo, status };
}

const produtoController = {
  // GET /api/produtos
  async listar(req, res) {
    try {
      const docs = await Produto.find({ ativo: true }).sort({ nome: 1 });
      res.json(docs.map(normalizarProduto));
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar produtos.', detalhes: error.message });
    }
  },

  // POST /api/produtos  ou  /api/produtos/cadastro
  async criar(req, res) {
    try {
      const {
        preco,          // vindo do front atual
        estoque,        // vindo do front atual
        precoVenda,     // nomes já no padrão novo
        estoqueAtual,
        categoria,
        ...rest
      } = req.body;     // <-- aqui era ":"; o correto é ";"

      const produto = new Produto({
        ...rest,
        precoVenda: Number(precoVenda ?? preco),
        estoqueAtual: Number(estoqueAtual ?? estoque),
        categoria: normalizarCategoria(categoria) ?? rest.categoria,
        ativo: true,
      });

      await produto.save();
      res.status(201).json({
        message: 'Produto criado com sucesso',
        produto: normalizarProduto(produto),
      });
    } catch (error) {
      res.status(400).json({ error: 'Erro ao cadastrar produto.', detalhes: error.message });
    }
  },

  // GET /api/produtos/:id
  async buscarPorId(req, res) {
    try {
      const produto = await Produto.findById(req.params.id);
      if (!produto || produto.ativo === false) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      res.json(normalizarProduto(produto));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/produtos/:id
  async atualizar(req, res) {
    try {
      const {
        preco, estoque,
        precoVenda, estoqueAtual,
        categoria,
        ...rest
      } = req.body;

      const update = { ...rest };
      if (precoVenda != null || preco != null) update.precoVenda = Number(precoVenda ?? preco);
      if (estoqueAtual != null || estoque != null) update.estoqueAtual = Number(estoqueAtual ?? estoque);
      if (categoria != null) update.categoria = normalizarCategoria(categoria);

      const produto = await Produto.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json(normalizarProduto(produto));
    } catch (error) {
      res.status(400).json({ error: 'Erro ao atualizar produto.', detalhes: error.message });
    }
  },

  // DELETE /api/produtos/:id  (soft delete)
  async deletar(req, res) {
    try {
      const produto = await Produto.findByIdAndUpdate(req.params.id, { ativo: false }, { new: true });
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json({ message: 'Produto removido' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // GET /api/produtos/codigo/:codigo (código interno, ex.: MT-0001)
  async buscarPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      const produto = await Produto.findOne({ codigo, ativo: true });
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json(normalizarProduto(produto));
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar por código.', detalhes: error.message });
    }
  },

  // GET /api/produtos/compatibilidade?marca=...&modelo=...&ano=...
  async buscarPorCompatibilidade(req, res) {
    try {
      const { marca, modelo, ano } = req.query;
      const filtro = { ativo: true };

      if (marca) filtro['compatibilidade.marca'] = marca;
      if (modelo) filtro['compatibilidade.modelo'] = modelo;
      if (ano) {
        filtro.$and = [
          { 'compatibilidade.anoInicial': { $lte: Number(ano) } },
          { 'compatibilidade.anoFinal':   { $gte: Number(ano) } },
        ];
      }

      const docs = await Produto.find(filtro);
      res.json(docs.map(normalizarProduto));
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar por compatibilidade.', detalhes: error.message });
    }
  },

  // GET /api/produtos/estoque-baixo
  async estoqueBaixo(req, res) {
    try {
      const docs = await Produto.find({ ativo: true });
      const itens = docs.map(normalizarProduto)
                        .filter(p => p.estoqueAtual <= p.estoqueMinimo);
      res.json({ total: itens.length, itens });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estoque baixo.', detalhes: error.message });
    }
  },
};

module.exports = produtoController;
