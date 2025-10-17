const express = require('express');
const router = express.Router();

// Importar todas as rotas de gestão de estoque
const codigoBarrasRoutes = require('./codigoBarras');
const historicoPrecoRoutes = require('./historicoPrecos');
const integracaoFornecedorRoutes = require('./integracaoFornecedores');

// Registrar as rotas
router.use('/codigo-barras', codigoBarrasRoutes);
router.use('/historico-precos', historicoPrecoRoutes);
router.use('/integracao-fornecedores', integracaoFornecedorRoutes);

// Rota de status da API
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'API de Gestão de Estoque funcionando',
        timestamp: new Date(),
        version: '1.0.0',
        modules: {
            codigoBarras: 'ativo',
            historicoPrecos: 'ativo',
            integracaoFornecedores: 'ativo'
        }
    });
});

// Rota de health check
router.get('/health', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        
        const status = {
            api: 'ok',
            database: mongoose.connection.readyState === 1 ? 'ok' : 'erro',
            timestamp: new Date(),
            uptime: process.uptime()
        };
        
        res.json({
            success: true,
            status
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro no health check',
            error: error.message
        });
    }
});

module.exports = router;