const express = require('express');
const router = express.Router();
const HistoricoPrecoController = require('../controllers/historico-Preco.Controller');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// Middleware de autenticação
router.use(authMiddleware);

// POST /api/historico-precos/atualizar
router.post('/atualizar',
    validationMiddleware.validarAtualizacaoPreco,
    HistoricoPrecoController.atualizarPreco
);

// GET /api/historico-precos/produto/:produtoId
router.get('/produto/:produtoId',
    HistoricoPrecoController.obterHistorico
);

// GET /api/historico-precos/relatorio/variacoes
router.get('/relatorio/variacoes',
    HistoricoPrecoController.relatorioVariacoes
);

// GET /api/historico-precos/alertas
router.get('/alertas',
    HistoricoPrecoController.alertasVariacao
);

// GET /api/historico-precos/dashboard/resumo
router.get('/dashboard/resumo', async (req, res) => {
    try {
        const HistoricoPreco = require('../models/HistoricoPreco');
        const { dias = 30 } = req.query;
        
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - parseInt(dias));
        
        // Estatísticas gerais
        const stats = await HistoricoPreco.aggregate([
            {
                $match: {
                    data: { $gte: dataInicio },
                    ativo: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalAlteracoes: { $sum: 1 },
                    aumentos: {
                        $sum: { $cond: [{ $gt: ['$variacao', 0] }, 1, 0] }
                    },
                    reducoes: {
                        $sum: { $cond: [{ $lt: ['$variacao', 0] }, 1, 0] }
                    },
                    variacaoMedia: { $avg: '$variacao' },
                    maiorAumento: { $max: '$variacao' },
                    maiorReducao: { $min: '$variacao' }
                }
            }
        ]);
        
        // Top produtos com mais alterações
        const topProdutos = await HistoricoPreco.aggregate([
            {
                $match: {
                    data: { $gte: dataInicio },
                    ativo: true
                }
            },
            {
                $group: {
                    _id: '$produtoId',
                    totalAlteracoes: { $sum: 1 },
                    ultimaAlteracao: { $max: '$data' }
                }
            },
            {
                $lookup: {
                    from: 'produtos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'produto'
                }
            },
            { $unwind: '$produto' },
            { $sort: { totalAlteracoes: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({
            success: true,
            data: {
                estatisticas: stats[0] || {},
                topProdutos
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter resumo do dashboard',
            error: error.message
        });
    }
});

// GET /api/historico-precos/grafico/:produtoId
router.get('/grafico/:produtoId', async (req, res) => {
    try {
        const HistoricoPreco = require('../models/HistoricoPreco');
        const { periodo = '90' } = req.query; // dias
        
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
        
        const dados = await HistoricoPreco.find({
            produtoId: req.params.produtoId,
            data: { $gte: dataInicio },
            ativo: true
        })
        .sort({ data: 1 })
        .select('data novoPreco motivo');
        
        res.json({
            success: true,
            data: dados.map(item => ({
                data: item.data,
                preco: item.novoPreco,
                motivo: item.motivo
            }))
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter dados do gráfico',
            error: error.message
        });
    }
});

// POST /api/historico-precos/aprovar/:id
router.post('/aprovar/:id', async (req, res) => {
    try {
        const HistoricoPreco = require('../models/HistoricoPreco');
        
        await HistoricoPreco.findByIdAndUpdate(req.params.id, {
            aprovado: true,
            aprovadoPor: req.user.id,
            dataAprovacao: new Date()
        });
        
        res.json({
            success: true,
            message: 'Alteração de preço aprovada'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar alteração',
            error: error.message
        });
    }
});

module.exports = router;