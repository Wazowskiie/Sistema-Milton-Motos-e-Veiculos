const HistoricoPreco = require('../models/HistoricoPreco');
const Produto = require('../models/Produto');

class HistoricoPrecoController {
    // Atualizar preço do produto
    async atualizarPreco(req, res) {
        try {
            const { produtoId, novoPreco, motivo, observacoes } = req.body;
            const usuarioId = req.user.id;

            const produto = await Produto.findById(produtoId);
            if (!produto) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            const precoAnterior = produto.preco;

            // Salvar no histórico
            const historicoPreco = new HistoricoPreco({
                produtoId,
                precoAnterior,
                novoPreco,
                variacao: ((novoPreco - precoAnterior) / precoAnterior * 100).toFixed(2),
                motivo,
                observacoes,
                usuarioId,
                data: new Date()
            });

            await historicoPreco.save();

            // Atualizar preço do produto
            await Produto.findByIdAndUpdate(produtoId, { 
                preco: novoPreco,
                dataUltimaAtualizacaoPreco: new Date()
            });

            res.json({
                success: true,
                message: 'Preço atualizado com sucesso',
                data: {
                    precoAnterior,
                    novoPreco,
                    variacao: historicoPreco.variacao
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar preço',
                error: error.message
            });
        }
    }

    // Obter histórico de preços de um produto
    async obterHistorico(req, res) {
        try {
            const { produtoId } = req.params;
            const { dataInicio, dataFim, limite = 50 } = req.query;

            let query = { produtoId };

            // Filtro por data se fornecido
            if (dataInicio || dataFim) {
                query.data = {};
                if (dataInicio) query.data.$gte = new Date(dataInicio);
                if (dataFim) query.data.$lte = new Date(dataFim);
            }

            const historico = await HistoricoPreco.find(query)
                .populate('usuarioId', 'nome')
                .sort({ data: -1 })
                .limit(parseInt(limite));

            const produto = await Produto.findById(produtoId, 'nome sku');

            res.json({
                success: true,
                data: {
                    produto,
                    historico,
                    total: historico.length
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao obter histórico',
                error: error.message
            });
        }
    }

    // Relatório de variações de preço
    async relatorioVariacoes(req, res) {
        try {
            const { dataInicio, dataFim, tipoVariacao } = req.query;

            let matchQuery = {};
            
            if (dataInicio || dataFim) {
                matchQuery.data = {};
                if (dataInicio) matchQuery.data.$gte = new Date(dataInicio);
                if (dataFim) matchQuery.data.$lte = new Date(dataFim);
            }

            if (tipoVariacao === 'aumento') {
                matchQuery.variacao = { $gt: 0 };
            } else if (tipoVariacao === 'reducao') {
                matchQuery.variacao = { $lt: 0 };
            }

            const relatorio = await HistoricoPreco.aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: 'produtos',
                        localField: 'produtoId',
                        foreignField: '_id',
                        as: 'produto'
                    }
                },
                { $unwind: '$produto' },
                {
                    $group: {
                        _id: '$produtoId',
                        nome: { $first: '$produto.nome' },
                        sku: { $first: '$produto.sku' },
                        totalAlteracoes: { $sum: 1 },
                        maiorVariacao: { $max: '$variacao' },
                        menorVariacao: { $min: '$variacao' },
                        variacaoMedia: { $avg: '$variacao' },
                        precoAtual: { $last: '$novoPreco' }
                    }
                },
                { $sort: { totalAlteracoes: -1 } }
            ]);

            res.json({
                success: true,
                data: relatorio
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório',
                error: error.message
            });
        }
    }

    // Alertas de variação de preço
    async alertasVariacao(req, res) {
        try {
            const { percentualMinimo = 10 } = req.query;
            const dataLimite = new Date();
            dataLimite.setDays(dataLimite.getDate() - 30); // Últimos 30 dias

            const alertas = await HistoricoPreco.find({
                data: { $gte: dataLimite },
                $or: [
                    { variacao: { $gt: percentualMinimo } },
                    { variacao: { $lt: -percentualMinimo } }
                ]
            })
            .populate('produtoId', 'nome sku categoria')
            .populate('usuarioId', 'nome')
            .sort({ data: -1 });

            res.json({
                success: true,
                data: alertas,
                total: alertas.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao obter alertas',
                error: error.message
            });
        }
    }
}

module.exports = new HistoricoPrecoController();