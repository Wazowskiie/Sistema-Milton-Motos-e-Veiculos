// scripts/migrar-produtos.js
require('dotenv').config();
const mongoose = require('mongoose');
const Produto = require('../models/Produto');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milton_motos_pecas';

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

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado em', MONGO_URI);

    const docs = await Produto.find({}, { // só os campos que vamos tocar
      preco: 1, precoVenda: 1,
      quantidade: 1, estoque: 1, estoqueAtual: 1, estoqueMinimo: 1,
      categoria: 1, ativo: 1
    }).lean();
    console.log('🔎 Produtos encontrados:', docs.length);

    const ops = [];
    let atualizados = 0;

    for (const p of docs) {
      const set = {};
      let changed = false;

      // precoVenda <- preco <- 0
      if (p.precoVenda == null) {
        set.precoVenda = Number(p.preco ?? 0);
        changed = true;
      }

      // estoqueAtual <- quantidade <- estoque <- 0
      if (p.estoqueAtual == null) {
        set.estoqueAtual = Number(
          p.quantidade ?? p.estoque ?? 0
        );
        changed = true;
      }

      // estoqueMinimo default
      if (p.estoqueMinimo == null) {
        set.estoqueMinimo = 0;
        changed = true;
      }

      // ativo default
      if (p.ativo == null) {
        set.ativo = true;
        changed = true;
      }

      // normalizar categoria
      if (typeof p.categoria === 'string') {
        const nova = normalizarCategoria(p.categoria);
        if (nova && nova !== p.categoria) {
          set.categoria = nova;
          changed = true;
        }
      }

      if (changed) {
        ops.push({
          updateOne: { filter: { _id: p._id }, update: { $set: set } }
        });
      }
    }

    if (ops.length) {
      const res = await Produto.collection.bulkWrite(ops); // bypass validação
      atualizados = (res.modifiedCount ?? 0) + (res.upsertedCount ?? 0);
    }

    console.log(`✅ Migração concluída. Documentos atualizados: ${atualizados}`);

    // (Opcional) Remover campos legados depois de testar tudo
    // await Produto.updateMany({}, { $unset: { preco: "", quantidade: "", estoque: "" } });

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  }
})();
