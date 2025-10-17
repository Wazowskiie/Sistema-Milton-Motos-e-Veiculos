const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.config = require('../config/configuracao');
  }
  
  async gerarOrcamento(dadosOrcamento) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const filename = `orcamento_${dadosOrcamento.numero}.pdf`;
        const filepath = path.join(__dirname, '../public/pdfs', filename);
        
        // Stream para arquivo
        doc.pipe(fs.createWriteStream(filepath));
        
        // Cabeçalho
        this.adicionarCabecalho(doc);
        
        // Dados do cliente
        doc.fontSize(16).text('ORÇAMENTO', 50, 150);
        doc.fontSize(12)
           .text(`Número: ${dadosOrcamento.numero}`, 50, 180)
           .text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 50, 195)
           .text(`Validade: ${dadosOrcamento.validade?.toLocaleDateString('pt-BR')}`, 50, 210);
        
        doc.text(`Cliente: ${dadosOrcamento.cliente.nome}`, 50, 240)
           .text(`Telefone: ${dadosOrcamento.cliente.telefone}`, 50, 255);
        
        // Tabela de itens
        this.adicionarTabelaItens(doc, dadosOrcamento.itens, 290);
        
        // Totais
        const yTotais = 290 + (dadosOrcamento.itens.length * 20) + 50;
        doc.text(`Subtotal: R$ ${dadosOrcamento.valores.subtotal.toFixed(2)}`, 400, yTotais)
           .text(`Desconto: R$ ${dadosOrcamento.valores.desconto.toFixed(2)}`, 400, yTotais + 15)
           .fontSize(14)
           .text(`TOTAL: R$ ${dadosOrcamento.valores.total.toFixed(2)}`, 400, yTotais + 35);
        
        // Rodapé
        this.adicionarRodape(doc);
        
        doc.end();
        
        doc.on('end', () => {
          resolve(filepath);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  adicionarCabecalho(doc) {
    doc.fontSize(20)
       .text(this.config.negocio.nomeEmpresa, 50, 50)
       .fontSize(12)
       .text(this.config.negocio.endereco, 50, 80)
       .text(`Tel: ${this.config.negocio.telefone} | WhatsApp: ${this.config.negocio.whatsapp}`, 50, 95)
       .text(`CNPJ: ${this.config.negocio.cnpj}`, 50, 110);
    
    // Linha separadora
    doc.moveTo(50, 130)
       .lineTo(550, 130)
       .stroke();
  }
  
  adicionarTabelaItens(doc, itens, yInicial) {
    // Cabeçalho da tabela
    doc.fontSize(10)
       .text('Item', 50, yInicial)
       .text('Qtd', 300, yInicial)
       .text('Preço Unit.', 350, yInicial)
       .text('Total', 450, yInicial);
    
    // Linha do cabeçalho
    doc.moveTo(50, yInicial + 15)
       .lineTo(550, yInicial + 15)
       .stroke();
    
    let y = yInicial + 25;
    
    itens.forEach(item => {
      doc.text(item.nome, 50, y, { width: 240, ellipsis: true })
         .text(item.quantidade.toString(), 300, y)
         .text(`R$ ${item.precoUnitario.toFixed(2)}`, 350, y)
         .text(`R$ ${(item.quantidade * item.precoUnitario).toFixed(2)}`, 450, y);
      y += 20;
    });
    
    // Linha final
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
  }
  
  adicionarRodape(doc) {
    const yRodape = 750;
    doc.fontSize(10)
       .text('Observações:', 50, yRodape)
       .text('- Preços válidos conforme data do orçamento', 50, yRodape + 15)
       .text('- Garantia de acordo com a política da empresa', 50, yRodape + 30)
       .text('- Peças sujeitas à disponibilidade de estoque', 50, yRodape + 45);
  }
  
  async gerarRelatorioVendas(dadosRelatorio) {
    // Implementação similar para relatórios
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const filename = `relatorio_vendas_${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../public/pdfs', filename);
        
        doc.pipe(fs.createWriteStream(filepath));
        
        this.adicionarCabecalho(doc);
        
        doc.fontSize(16).text('RELATÓRIO DE VENDAS', 50, 150);
        doc.fontSize(12)
           .text(`Período: ${dadosRelatorio.periodo}`, 50, 180)
           .text(`Total de Vendas: ${dadosRelatorio.totalVendas}`, 50, 195)
           .text(`Faturamento: R$ ${dadosRelatorio.faturamento.toFixed(2)}`, 50, 210);
        
        // Adicionar gráficos e tabelas conforme necessário
        
        doc.end();
        
        doc.on('end', () => {
          resolve(filepath);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
}