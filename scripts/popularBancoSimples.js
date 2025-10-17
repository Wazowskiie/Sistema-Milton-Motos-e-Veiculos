// scripts/popularBancoSimples.js
// Script independente que não depende dos modelos existentes

const mongoose = require('mongoose');

// Conectar ao banco
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/milton_motos_pecas';

console.log('🔗 Conectando ao MongoDB...');

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Conectado ao MongoDB');
  
  // Acessar diretamente as coleções
  const db = mongoose.connection.db;
  
  try {
    console.log('🗑️ Limpando dados existentes...');
    
    // Limpar coleções existentes
    await db.collection('produtos').deleteMany({});
    await db.collection('codigosbarras').deleteMany({});
    await db.collection('fornecedores').deleteMany({});
    
    console.log('🏢 Inserindo fornecedores...');
    
    // Inserir fornecedores diretamente
    const fornecedores = await db.collection('fornecedores').insertMany([
      {
        nome: 'Tecfil Filtros',
        cnpj: '12.345.678/0001-90',
        email: 'vendas@tecfil.com.br',
        telefone: '(11) 3333-4444',
        endereco: 'São Paulo, SP',
        status: 'ativo',
        dataCriacao: new Date()
      },
      {
        nome: 'NGK do Brasil', 
        cnpj: '98.765.432/0001-10',
        email: 'comercial@ngk.com.br',
        telefone: '(11) 5555-6666',
        endereco: 'São Bernardo do Campo, SP',
        status: 'ativo',
        dataCriacao: new Date()
      },
      {
        nome: 'Cobreq',
        cnpj: '11.222.333/0001-44', 
        email: 'vendas@cobreq.com.br',
        telefone: '(11) 7777-8888',
        endereco: 'Diadema, SP',
        status: 'ativo',
        dataCriacao: new Date()
      },
      {
        nome: 'Motul Brasil',
        cnpj: '55.666.777/0001-88',
        email: 'b2b@motul.com.br', 
        telefone: '(11) 9999-0000',
        endereco: 'São Paulo, SP',
        status: 'ativo',
        dataCriacao: new Date()
      }
    ]);

    console.log(`✅ ${fornecedores.insertedCount} fornecedores inseridos`);

    console.log('📦 Inserindo produtos...');

    // Mapear IDs dos fornecedores
    const fornecedorTecfil = fornecedores.insertedIds[0];
    const fornecedorNGK = fornecedores.insertedIds[1]; 
    const fornecedorCobreq = fornecedores.insertedIds[2];
    const fornecedorMotul = fornecedores.insertedIds[3];

    // Inserir produtos diretamente
    const produtos = await db.collection('produtos').insertMany([
      {
        codigo: 'MT-0001',
        nome: 'Filtro de Óleo Honda CG 160',
        categoria: 'Motor',
        marca: 'Tecfil',
        modelo: 'CG 160, CG 150, Bros 160',
        preco: 29.90,
        quantidade: 50,
        estoqueMinimo: 10,
        descricao: 'Filtro de óleo original para motocicletas Honda. Alta qualidade e durabilidade.',
        fornecedor: fornecedorTecfil,
        peso: 0.2,
        dimensoes: '10x8x5 cm',
        ativo: true,
        dataCriacao: new Date(),
        dataUltimaAtualizacao: new Date()
      },
      {
        codigo: 'FR-0001', 
        nome: 'Pastilha de Freio Yamaha Factor 125',
        categoria: 'Freio',
        marca: 'Cobreq',
        modelo: 'Factor 125, YBR 125, XTZ 125',
        preco: 45.50,
        quantidade: 30,
        estoqueMinimo: 5,
        descricao: 'Pastilha de freio dianteira com composto cerâmico para maior durabilidade.',
        fornecedor: fornecedorCobreq,
        peso: 0.3,
        dimensoes: '12x8x2 cm', 
        ativo: true,
        dataCriacao: new Date(),
        dataUltimaAtualizacao: new Date()
      },
      {
        codigo: 'EL-0001',
        nome: 'Vela de Ignição NGK Honda CG', 
        categoria: 'Eletrica',
        marca: 'NGK',
        modelo: 'CG 125, CG 150, CG 160, Titan',
        preco: 18.90,
        quantidade: 100,
        estoqueMinimo: 20,
        descricao: 'Vela de ignição NGK original com eletrodo de cobre.',
        fornecedor: fornecedorNGK,
        peso: 0.1,
        dimensoes: '8x2x2 cm',
        ativo: true,
        dataCriacao: new Date(),
        dataUltimaAtualizacao: new Date()
      },
      {
        codigo: 'MT-0002',
        nome: 'Óleo Motor 15W40 Motul',
        categoria: 'Motor', 
        marca: 'Motul',
        modelo: 'Todas as motos 4T',
        preco: 35.90,
        quantidade: 25,
        estoqueMinimo: 8,
        descricao: 'Óleo lubrificante semissintético 15W40 para motores 4 tempos. 1 litro.',
        fornecedor: fornecedorMotul,
        peso: 1.0,
        dimensoes: '25x8x8 cm',
        ativo: true,
        dataCriacao: new Date(),
        dataUltimaAtualizacao: new Date()
      },
      {
        codigo: 'TR-0001',
        nome: 'Kit Relação Yamaha XJ6',
        categoria: 'Transmissao',
        marca: 'Vaz', 
        modelo: 'XJ6 600, MT-03',
        preco: 280.00,
        quantidade: 15,
        estoqueMinimo: 3,
        descricao: 'Kit relação completo com coroa 45 dentes, pinhão 16 dentes e corrente 520H.',
        fornecedor: fornecedorCobreq, // Usando Cobreq como fornecedor
        peso: 2.5,
        dimensoes: '35x25x15 cm',
        ativo: true,
        dataCriacao: new Date(),
        dataUltimaAtualizacao: new Date()
      },
      {
        codigo: 'SP-0001',
        nome: 'Amortecedor Traseiro YSS Fazer 250',
        categoria: 'Suspensao',
        marca: 'YSS',
        modelo: 'Fazer 250, Lander 250', 
        preco: 320.00,
        quantidade: 8,
        estoqueMinimo: 2,
        descricao: 'Amortecedor traseiro regulável com reservatório separado.',
        fornecedor: fornecedorTecfil, // Usando Tecfil como fornecedor
        peso: 1.8,
        dimensoes: '40x10x10 cm',
        ativo: true,
        dataCriacao: new Date(),
        dataUltimaAtualizacao: new Date()
      }
    ]);

    console.log(`✅ ${produtos.insertedCount} produtos inseridos`);

    console.log('📱 Criando códigos de barras...');

    // Códigos de barras correspondentes
    const codigosBarras = [
      '7891234567890', // Filtro Honda
      '7891234567891', // Pastilha Yamaha  
      '7891234567892', // Vela NGK
      '1234567890123', // Óleo Motul
      '9876543210987', // Kit Relação
      '5555666677778'  // Amortecedor
    ];

    const produtoIds = Object.values(produtos.insertedIds);
    const codigosParaInserir = produtoIds.map((produtoId, index) => ({
      produtoId: produtoId,
      codigo: codigosBarras[index],
      tipo: 'EAN13',
      ativo: true,
      dataCriacao: new Date()
    }));

    const codigosInseridos = await db.collection('codigosbarras').insertMany(codigosParaInserir);

    console.log(`✅ ${codigosInseridos.insertedCount} códigos de barras criados`);

    // Atualizar produtos com códigos de barras
    for (let i = 0; i < produtoIds.length; i++) {
      await db.collection('produtos').updateOne(
        { _id: produtoIds[i] },
        { 
          $set: { 
            codigoBarras: codigosBarras[i],
            tipoCodigoBarras: 'EAN13'
          } 
        }
      );
    }

    console.log('🎉 Banco de dados populado com sucesso!');
    console.log('');
    console.log('📊 RESUMO:');
    console.log(`• Fornecedores: ${fornecedores.insertedCount}`);
    console.log(`• Produtos: ${produtos.insertedCount}`);
    console.log(`• Códigos de Barras: ${codigosInseridos.insertedCount}`);
    console.log('');
    console.log('📋 CÓDIGOS DE BARRAS DISPONÍVEIS PARA TESTE:');
    console.log('• 7891234567890 - Filtro de Óleo Honda CG 160 (R$ 29,90)');
    console.log('• 7891234567891 - Pastilha de Freio Yamaha Factor 125 (R$ 45,50)');
    console.log('• 7891234567892 - Vela de Ignição NGK Honda CG (R$ 18,90)');
    console.log('• 1234567890123 - Óleo Motor 15W40 Motul (R$ 35,90)');
    console.log('• 9876543210987 - Kit Relação Yamaha XJ6 (R$ 280,00)');
    console.log('• 5555666677778 - Amortecedor Traseiro YSS Fazer 250 (R$ 320,00)');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Teste qualquer código acima no seu sistema de cadastro');
    console.log('2. Os dados serão preenchidos automaticamente');
    console.log('3. Ajuste quantidade e confirme o cadastro');
    console.log('');
    console.log('✅ Sistema pronto para uso!');

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error.message);
  }

}).catch(error => {
  console.error('❌ Erro de conexão:', error.message);
}).finally(() => {
  mongoose.connection.close();
  console.log('🔌 Conexão fechada');
});

// Tratar sinal de interrupção
process.on('SIGINT', () => {
  console.log('\n🛑 Interrompido pelo usuário');
  mongoose.connection.close();
  process.exit(0);
});
