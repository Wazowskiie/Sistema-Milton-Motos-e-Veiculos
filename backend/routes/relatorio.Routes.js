const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Produto = require('../models/Produto');

router.get('/estoque', async (req, res) => {
  const produtos = await Produto.find();

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio_estoque.pdf');
  doc.pipe(res);

  doc.fontSize(18).text('Relatório de Estoque - Milton Motos', { align: 'center' });
  doc.moveDown();

  produtos.forEach(p => {
    doc
      .fontSize(12)
      .text(`Nome: ${p.nome}`)
      .text(`Categoria: ${p.categoria}`)
      .text(`Preço: R$ ${p.preco}`)
      .text(`Quantidade: ${p.quantidade}`)
      .moveDown();
  });

  doc.end();


  
});

module.exports = router;
