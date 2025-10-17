const Alerta = require('../models/Alerta');
const Produto = require('../models/Produto');

class AlertaService {
  // Verificar estoque baixo
  static async verificarEstoqueBaixo() {
    try {
      const produtosBaixoEstoque = await Produto.find({
        $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] },
        ativo: true
      });
      
      for (const produto of produtosBaixoEstoque) {
        // Verificar se já existe alerta similar recente
        const alerteExistente = await Alerta.findOne({
          tipo: 'estoque_baixo',
          produto: produto._id,
          status: { $in: ['pendente', 'visualizado'] },
          dataCriacao: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // últimas 24h
        });
        
        if (!alerteExistente) {
          await Alerta.create({
            tipo: produto.estoqueAtual === 0 ? 'estoque_zerado' : 'estoque_baixo',
            prioridade: produto.estoqueAtual === 0 ? 'critica' : 'alta',
            titulo: produto.estoqueAtual === 0 ? 'Produto Esgotado' : 'Estoque Baixo',
            mensagem: produto.estoqueAtual === 0 
              ? `${produto.nome} está com estoque zerado`
              : `${produto.nome} está com estoque baixo: ${produto.estoqueAtual} unidades (mín: ${produto.estoqueMinimo})`,
            produto: produto._id,
            quantidadeEstoque: produto.estoqueAtual,
            acoesSugeridas: [
              'Fazer pedido ao fornecedor',
              'Verificar produtos alternativos',
              'Ajustar estoque mínimo',
              'Contatar fornecedor para prazo de entrega'
            ]
          });
        }
      }
      
      console.log(`Verificação de estoque: ${produtosBaixoEstoque.length} alertas processados`);
      
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error);
    }
  }
  
  // Detectar produtos parados (sem venda há muito tempo)
  static async detectarProdutosParados() {
    try {
      const diasLimite = 60; // 60 dias sem venda
      const dataLimite = new Date(Date.now() - diasLimite * 24 * 60 * 60 * 1000);
      
      const produtosParados = await Produto.find({
        ativo: true,
        estoqueAtual: { $gt: 0 },
        $or: [
          { ultimaVenda: { $lt: dataLimite } },
          { ultimaVenda: { $exists: false } }
        ]
      });
      
      for (const produto of produtosParados) {
        const alerteExistente = await Alerta.findOne({
          tipo: 'produto_parado',
          produto: produto._id,
          status: { $in: ['pendente', 'visualizado'] },
          dataCriacao: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // última semana
        });
        
        if (!alerteExistente) {
          await Alerta.create({
            tipo: 'produto_parado',
            prioridade: 'media',
            titulo: 'Produto com Baixo Giro',
            mensagem: `${produto.nome} não teve vendas nos últimos ${diasLimite} dias (Estoque: ${produto.estoqueAtual})`,
            produto: produto._id,
            quantidadeEstoque: produto.estoqueAtual,
            acoesSugeridas: [
              'Criar promoção',
              'Revisar preço',
              'Verificar demanda',
              'Considerar descontinuar',
              'Melhorar descrição/fotos'
            ]
          });
        }
      }
      
      console.log(`Produtos parados: ${produtosParados.length} alertas processados`);
      
    } catch (error) {
      console.error('Erro ao detectar produtos parados:', error);
    }
  }
  
  // Monitorar alterações de preço suspeitas
  static async monitorarAlteracoesPreco() {
    try {
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const produtos = await Produto.find({
        'historicoPrecos.data': { $gte: ontem },
        ativo: true
      });
      
      for (const produto of produtos) {
        const alteracoesRecentes = produto.historicoPrecos.filter(
          h => h.data >= ontem
        );
        
        for (const alteracao of alteracoesRecentes) {
          const precoAnterior = produto.historicoPrecos
            .filter(h => h.data < alteracao.data)
            .pop()?.preco || produto.precoVenda;
          
          const variacaoPercentual = Math.abs(
            ((alteracao.preco - precoAnterior) / precoAnterior) * 100
          );
          
          // Alertar se a variação for > 20%
          if (variacaoPercentual > 20) {
            await Alerta.create({
              tipo: 'preco_alterado',
              prioridade: variacaoPercentual > 50 ? 'alta' : 'media',
              titulo: 'Alteração Significativa de Preço',
              mensagem: `${produto.nome}: preço alterado de R$ ${precoAnterior.toFixed(2)} para R$ ${alteracao.preco.toFixed(2)} (${variacaoPercentual.toFixed(1)}%)`,
              produto: produto._id,
              valorAnterior: precoAnterior,
              valorAtual: alteracao.preco,
              acoesSugeridas: [
                'Verificar se a alteração foi intencional',
                'Comunicar mudança aos clientes',
                'Revisar margem de lucro',
                'Atualizar material promocional'
              ]
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao monitorar alterações de preço:', error);
    }
  }
}