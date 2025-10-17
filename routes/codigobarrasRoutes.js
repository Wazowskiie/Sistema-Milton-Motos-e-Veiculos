const express = require('express');
const router = express.Router();
const CodigoBarrasController = require('../controllers/codigoBarrasController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// POST /api/codigo-barras/gerar
router.post('/gerar', 
    validationMiddleware.validarGerarCodigoBarras,
    CodigoBarrasController.gerarCodigoBarras
);

// GET /api/codigo-barras/buscar/:codigo
router.get('/buscar/:codigo', 
    CodigoBarrasController.buscarPorCodigo
);

// POST /api/codigo-barras/validar
router.post('/validar', 
    validationMiddleware.validarCodigoBarras,
    CodigoBarrasController.validarCodigo
);

// GET /api/codigo-barras/produto/:produtoId
router.get('/produto/:produtoId', async (req, res) => {
    try {
        const CodigoBarras = require('../models/CodigoBarras');
        const codigoBarras = await CodigoBarras.obterCodigoAtivo(req.params.produtoId);
        
        if (!codigoBarras) {
            return res.status(404).json({
                success: false,
                message: 'Código de barras não encontrado para este produto'
            });
        }
        
        res.json({
            success: true,
            data: codigoBarras
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar código de barras',
            error: error.message
        });
    }
});

// PUT /api/codigo-barras/:id/desativar
router.put('/:id/desativar', async (req, res) => {
    try {
        const CodigoBarras = require('../models/CodigoBarras');
        
        await CodigoBarras.findByIdAndUpdate(req.params.id, {
            ativo: false,
            dataDesativacao: new Date()
        });
        
        res.json({
            success: true,
            message: 'Código de barras desativado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar código de barras',
            error: error.message
        });
    }
});

// GET /api/codigo-barras/relatorio/tipos
router.get('/relatorio/tipos', async (req, res) => {
    try {
        const CodigoBarras = require('../models/CodigoBarras');
        
        const relatorio = await CodigoBarras.aggregate([
            { $match: { ativo: true } },
            {
                $group: {
                    _id: '$tipo',
                    quantidade: { $sum: 1 }
                }
            },
            { $sort: { quantidade: -1 } }
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
});

module.exports = router;