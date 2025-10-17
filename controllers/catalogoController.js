const Produto = require('../models/Produto');

const catalogoController = {
  // Busca inteligente por compatibilidade
  async buscarPorMoto(req, res) {
    try {
      const { marca, modelo, ano, categoria } = req.query;
      
      if (!marca || !modelo || !ano) {
        return res.status(400).json({ 
          error: 'Marca, modelo e ano são obrigatórios' 
        });
      }
      
      const filtros = {
        ativo: true,
        estoqueAtual: { $gt: 0 },
        'compatibilidade.marca': { $regex: marca, $options: 'i' },
        'compatibilidade.modelo': { $regex: modelo, $options: 'i' },
        'compatibilidade.anoInicial': { $lte: parseInt(ano) },
        'compatibilidade.anoFinal': { $gte: parseInt(ano) }
      };
      
      if (categoria) {
        filtros.categoria = categoria;
      }
      
      const produtos = await Produto.find(filtros)
        .populate('fornecedor')
        .sort({ quantidadeVendida: -1, notaMedia: -1 });
      
      // Organizar por categoria para facilitar navegação
      const produtosPorCategoria = produtos.reduce((acc, produto) => {
        const cat = produto.categoria || 'outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          ...produto.toObject(),
          precoAtual: produto.precoAtual(),
          emPromocao: produto.estaEmPromocao(),
          precisaReposicao: produto.precisaReposicao()
        });
        return acc;
      }, {});
      
      res.json({
        totalEncontrados: produtos.length,
        veiculo: { marca, modelo, ano },
        categorias: produtosPorCategoria,
        sugestoes: await this.gerarSugestoes(marca, modelo, ano)
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Gerar sugestões baseadas no veículo
  async gerarSugestoes(marca, modelo, ano) {
    const sugestoesPorKm = {
      '1000': ['Filtro de óleo', 'Óleo do motor'],
      '5000': ['Filtro de óleo', 'Óleo do motor', 'Filtro de ar'],
      '10000': ['Filtro de óleo', 'Óleo do motor', 'Filtro de ar', 'Velas'],
      '20000': ['Kit relação', 'Pastilhas de freio', 'Pneus']
    };
    
    return sugestoesPorKm;
  },
  
  // Busca por código de barras
  async buscarPorCodigoBarras(req, res) {
    try {
      const { codigo } = req.params;
      
      const produto = await Produto.findOne({
        $or: [
          { codigoBarras: codigo },
          { codigo: codigo }
        ],
        ativo: true
      });
      
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      res.json({
        ...produto.toObject(),
        precoAtual: produto.precoAtual(),
        emPromocao: produto.estaEmPromocao(),
        precisaReposicao: produto.precisaReposicao()
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Produtos em destaque/promoção
  async produtosDestaque(req, res) {
    try {
      const destaques = await Produto.find({
        ativo: true,
        destaque: true,
        estoqueAtual: { $gt: 0 }
      }).limit(10);
      
      const promocoes = await Produto.find({
        ativo: true,
        promocao: true,
        estoqueAtual: { $gt: 0 },
        'dataPromocao.inicio': { $lte: new Date() },
        'dataPromocao.fim': { $gte: new Date() }
      }).limit(10);
      
      res.json({
        destaques: destaques.map(p => ({
          ...p.toObject(),
          precoAtual: p.precoAtual()
        })),
        promocoes: promocoes.map(p => ({
          ...p.toObject(),
          precoAtual: p.precoAtual(),
          percentualDesconto: ((p.precoVenda - p.precoPromocional) / p.precoVenda * 100).toFixed(0)
        }))
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
