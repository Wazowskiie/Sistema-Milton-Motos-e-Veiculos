const Cliente = require('../models/Cliente');

const fidelidadeController = {
  // Calcular pontos por compra
  calcularPontos(valorCompra, nivelCliente = 'bronze') {
    const multiplicadores = {
      bronze: 1,
      prata: 1.5,
      ouro: 2
    };
    
    const pontosBase = Math.floor(valorCompra / 10); // 1 ponto a cada R$ 10
    return Math.floor(pontosBase * multiplicadores[nivelCliente]);
  },
  
  // Calcular desconto por nível
  calcularDesconto(nivelCliente) {
    const descontos = {
      bronze: 0,
      prata: 0.05,  // 5%
      ouro: 0.10    // 10%
    };
    
    return descontos[nivelCliente] || 0;
  },
  
  // Adicionar pontos após compra
  async adicionarPontos(req, res) {
    try {
      const { clienteId, valorCompra, produtoId, quantidade } = req.body;
      
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      const pontos = this.calcularPontos(valorCompra, cliente.nivelFidelidade);
      
      cliente.pontosAcumulados += pontos;
      cliente.historicoCompras.push({
        produto: produtoId,
        quantidade,
        valor: valorCompra,
        pontos
      });
      
      await cliente.save();
      
      res.json({
        pontosAdicionados: pontos,
        totalPontos: cliente.pontosAcumulados,
        nivelAtual: cliente.nivelFidelidade,
        proximoNivel: this.proximoNivel(cliente.pontosAcumulados)
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  proximoNivel(pontos) {
    if (pontos < 500) return { nivel: 'prata', faltam: 500 - pontos };
    if (pontos < 1000) return { nivel: 'ouro', faltam: 1000 - pontos };
    return { nivel: 'ouro', faltam: 0 };
  },
  
  // Resgatar pontos
  async resgatarPontos(req, res) {
    try {
      const { clienteId, pontosUtilizados, descricao } = req.body;
      
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      if (cliente.pontosAcumulados < pontosUtilizados) {
        return res.status(400).json({ 
          error: 'Pontos insuficientes',
          disponivel: cliente.pontosAcumulados
        });
      }
      
      cliente.pontosAcumulados -= pontosUtilizados;
      await cliente.save();
      
      res.json({
        pontosUtilizados,
        saldoAtual: cliente.pontosAcumulados,
        valorDesconto: pontosUtilizados * 0.01 // 1 ponto = R$ 0,01
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};