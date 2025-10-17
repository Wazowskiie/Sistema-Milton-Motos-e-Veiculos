const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Conectar ao MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/milton_motos_pecas')
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch(err => console.error("❌ Erro ao conectar:", err));

// Importar modelos
const Produto = require('./models/Produto');
const Usuario = require('../models/Usuario');

// Dados iniciais
const produtosIniciais = [
  {
    nome: "Pastilha de Freio Dianteira",
    categoria: "freio",
    subcategoria: "pastilha",
    descricao: "Pastilha dianteira compatível com Honda CG 160",
    precoVenda: 75.50,
    precoCusto: 45.30,
    estoqueAtual: 20,
    estoqueMinimo: 5,
    fornecedor: {
      nome: "Honda Peças Originais",
      contato: "(11) 4444-5555"
    },
    compatibilidade: [{
      marca: "Honda",
      modelo: "CG 160",
      anoInicial: 2015,
      anoFinal: 2023
    }],
    localizacao: {
      corredor: "A",
      prateleira: "1",
      posicao: "3"
    }
  },
  {
    nome: "Filtro de Óleo",
    categoria: "motor",
    subcategoria: "filtro",
    descricao: "Filtro de óleo para motos até 300cc",
    precoVenda: 25.00,
    precoCusto: 15.50,
    estoqueAtual: 50,
    estoqueMinimo: 10,
    fornecedor: {
      nome: "Motul",
      contato: "(11) 3333-4444"
    },
    compatibilidade: [{
      marca: "Honda",
      modelo: "CG 160",
      anoInicial: 2010,
      anoFinal: 2023
    }, {
      marca: "Yamaha",
      modelo: "Factor 125",
      anoInicial: 2012,
      anoFinal: 2023
    }],
    localizacao: {
      corredor: "B",
      prateleira: "2",
      posicao: "1"
    }
  },
  {
    nome: "Cabo de Embreagem",
    categoria: "transmissao",
    subcategoria: "cabo",
    descricao: "Cabo de embreagem reforçado para Yamaha Fazer",
    precoVenda: 40.00,
    precoCusto: 24.00,
    estoqueAtual: 15,
    estoqueMinimo: 3,
    fornecedor: {
      nome: "Yamaha",
      contato: "(11) 2222-3333"
    },
    compatibilidade: [{
      marca: "Yamaha",
      modelo: "Fazer 250",
      anoInicial: 2010,
      anoFinal: 2020
    }],
    localizacao: {
      corredor: "C",
      prateleira: "1",
      posicao: "5"
    }
  },
  {
    nome: "Kit Relação Completo",
    categoria: "transmissao",
    subcategoria: "kit",
    descricao: "Kit completo: coroa, pinhão e corrente para Honda Bros 160",
    precoVenda: 220.00,
    precoCusto: 140.00,
    estoqueAtual: 8,
    estoqueMinimo: 2,
    fornecedor: {
      nome: "Did Chain",
      contato: "(11) 5555-6666"
    },
    compatibilidade: [{
      marca: "Honda",
      modelo: "Bros 160",
      anoInicial: 2015,
      anoFinal: 2023
    }],
    localizacao: {
      corredor: "A",
      prateleira: "3",
      posicao: "1"
    }
  },
  {
    nome: "Lâmpada Farol H4",
    categoria: "eletrica",
    subcategoria: "lampada",
    descricao: "Lâmpada 35/35W para farol de motos",
    precoVenda: 18.00,
    precoCusto: 10.50,
    estoqueAtual: 30,
    estoqueMinimo: 8,
    fornecedor: {
      nome: "Philips",
      contato: "(11) 7777-8888"
    },
    localizacao: {
      corredor: "D",
      prateleira: "1",
      posicao: "2"
    }
  }
];

const usuariosIniciais = [
  {
    nome: "Administrador",
    email: "admin@miltonmotos.com",
    senha: "admin123",
    nivel: "admin"
  },
  {
    nome: "Milton Silva",
    email: "milton@miltonmotos.com",
    senha: "milton123",
    nivel: "gerente"
  },
  {
    nome: "Maria Santos",
    email: "maria@miltonmotos.com",
    senha: "maria123",
    nivel: "funcionario"
  }
];

async function seedDB() {
  try {
    // Limpar collections
    // await Produto.deleteMany();
    await Usuario.deleteMany();
    console.log("🧹 Collections limpas");

    // Inserir produtos
    await Produto.insertMany(produtosIniciais);
    console.log("📦 Produtos inseridos");

    // Inserir usuários com senhas criptografadas
    for (const user of usuariosIniciais) {
      const senhaHash = await bcrypt.hash(user.senha, 10);
      await Usuario.create({
        ...user,
        senha: senhaHash
      });
    }
    console.log("👥 Usuários inseridos");

    console.log("🌱 Banco populado com sucesso!");
    console.log("\n📋 USUÁRIOS CRIADOS:");
    console.log("admin@miltonmotos.com - Senha: admin123 (Administrador)");
    console.log("milton@miltonmotos.com - Senha: milton123 (Gerente)");
    console.log("maria@miltonmotos.com - Senha: maria123 (Funcionário)");
    
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Erro ao popular o banco:", err);
  }
}

seedDB();
