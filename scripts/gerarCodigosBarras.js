function gerarCodigoEAN13() {
  // Prefixo 789 = Brasil
  let codigo = '789';
  
  // 9 dígitos aleatórios
  for (let i = 0; i < 9; i++) {
    codigo += Math.floor(Math.random() * 10);
  }
  
  // Calcular dígito verificador
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const digitoVerificador = (10 - (soma % 10)) % 10;
  
  return codigo + digitoVerificador;
}

function gerarLoteProdutos(quantidade = 50) {
  const categorias = ['Motor', 'Freio', 'Eletrica', 'Suspensao', 'Transmissao', 'Carroceria'];
  const marcas = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Tecfil', 'NGK', 'Cobreq', 'Motul'];
  const produtos = [];

  for (let i = 1; i <= quantidade; i++) {
    const categoria = categorias[Math.floor(Math.random() * categorias.length)];
    const marca = marcas[Math.floor(Math.random() * marcas.length)];
    
    produtos.push({
      codigo: `MM-${i.toString().padStart(4, '0')}`,
      nome: `Peça Automotiva ${categoria} ${marca} ${i}`,
      categoria,
      marca,
      modelo: `Modelo ${Math.floor(Math.random() * 1000) + 100}`,
      preco: Math.round((Math.random() * 500 + 10) * 100) / 100,
      quantidade: Math.floor(Math.random() * 50) + 5,
      estoqueMinimo: Math.floor(Math.random() * 10) + 2,
      descricao: `Descrição da peça ${categoria.toLowerCase()} para ${marca}`,
      codigoBarras: gerarCodigoEAN13(),
      tipoCodigoBarras: 'EAN13',
      ativo: true
    });
  }

  return produtos;
}

console.log('📦 Gerando 10 produtos de exemplo:');
const produtosExemplo = gerarLoteProdutos(10);
produtosExemplo.forEach(p => {
  console.log(`${p.codigoBarras} - ${p.nome} (R$ ${p.preco})`);
});