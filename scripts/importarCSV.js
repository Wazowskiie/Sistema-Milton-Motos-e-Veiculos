const fs = require('fs');
const csv = require('csv-parser');

async function importarProdutosCSV(caminhoArquivo) {
  const produtos = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(caminhoArquivo)
      .pipe(csv({
        // Mapeamento de colunas
        mapHeaders: ({ header }) => {
          const headerMap = {
            'Nome': 'nome',
            'Código': 'codigo',
            'Preço': 'preco',
            'Estoque': 'quantidade',
            'Categoria': 'categoria',
            'Marca': 'marca',
            'Código de Barras': 'codigoBarras'
          };
          return headerMap[header] || header.toLowerCase();
        }
      }))
      .on('data', (row) => {
        produtos.push({
          codigo: row.codigo || `MM-${Date.now()}`,
          nome: row.nome,
          categoria: row.categoria || 'Outros',
          marca: row.marca || 'Genérica',
          preco: parseFloat(row.preco) || 0,
          quantidade: parseInt(row.quantidade) || 0,
          estoqueMinimo: 5,
          codigoBarras: row.codigoBarras || gerarCodigoEAN13(),
          tipoCodigoBarras: 'EAN13',
          ativo: true,
          dataCriacao: new Date()
        });
      })
      .on('end', () => {
        console.log(`📄 ${produtos.length} produtos carregados do CSV`);
        resolve(produtos);
      })
      .on('error', reject);
  });
}