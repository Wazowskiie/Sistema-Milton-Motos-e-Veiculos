const express = require('express');
const router = express.Router();
const IntegracaoFornecedorController = require('../controllers/integracaoFornecedorController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// Middleware de autenticação
router.use(authMiddleware);

// POST /api/integracao-fornecedores/configurar
router.post('/configurar',
    validationMiddleware.validarConfiguracaoIntegracao,
    IntegracaoFornecedorController.configurarIntegracao
);

// POST /api/integracao-fornecedores/sincronizar/:integracaoId
router.post('/sincronizar/:integracaoId',
    IntegracaoFornecedorController.sincronizarFornecedor
);

// GET /api/integracao-fornecedores
router.get('/',
    IntegracaoFornecedorController.listarIntegracoes
);

// GET /api/integracao-fornecedores/:id
router.get('/:id', async (req, res) => {
    try {
        const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
        
        const integracao = await IntegracaoFornecedor.findById(req.params.id)
            .populate('fornecedorId', 'nome cnpj email telefone');
        
        if (!integracao) {
            return res.status(404).json({
                success: false,
                message: 'Integração não encontrada'
            });
        }
        
        res.json({
            success: true,
            data: integracao
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar integração',
            error: error.message
        });
    }
});

// PUT /api/integracao-fornecedores/:id
router.put('/:id', async (req, res) => {
    try {
        const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
        
        const integracao = await IntegracaoFornecedor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!integracao) {
            return res.status(404).json({
                success: false,
                message: 'Integração não encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Integração atualizada com sucesso',
            data: integracao
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar integração',
            error: error.message
        });
    }
});

// DELETE /api/integracao-fornecedores/:id
router.delete('/:id', async (req, res) => {
    try {
        const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
        
        const integracao = await IntegracaoFornecedor.findByIdAndUpdate(
            req.params.id,
            { ativo: false },
            { new: true }
        );
        
        if (!integracao) {
            return res.status(404).json({
                success: false,
                message: 'Integração não encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Integração desativada com sucesso'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar integração',
            error: error.message
        });
    }
});

// POST /api/integracao-fornecedores/:id/testar
router.post('/:id/testar', async (req, res) => {
    try {
        const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
        
        const integracao = await IntegracaoFornecedor.findById(req.params.id);
        
        if (!integracao) {
            return res.status(404).json({
                success: false,
                message: 'Integração não encontrada'
            });
        }
        
        // Atualizar status para testando
        integracao.status = 'testando';
        await integracao.save();
        
        // Executar teste de conexão baseado no tipo
        let resultadoTeste;
        
        try {
            switch (integracao.tipo) {
                case 'api':
                    const axios = require('axios');
                    const response = await axios({
                        method: integracao.configuracao.metodo || 'GET',
                        url: integracao.configuracao.url,
                        headers: integracao.configuracao.headers,
                        timeout: 10000
                    });
                    resultadoTeste = {
                        sucesso: true,
                        statusCode: response.status,
                        mensagem: 'Conexão API estabelecida com sucesso'
                    };
                    break;
                    
                case 'xml':
                case 'csv':
                case 'json':
                    const testResponse = await axios.get(integracao.configuracao.url, { timeout: 10000 });
                    resultadoTeste = {
                        sucesso: true,
                        tamanhoArquivo: testResponse.data.length,
                        mensagem: 'Arquivo acessível e legível'
                    };
                    break;
                    
                default:
                    resultadoTeste = {
                        sucesso: true,
                        mensagem: 'Configuração válida'
                    };
            }
            
            integracao.status = 'ativo';
            
        } catch (error) {
            resultadoTeste = {
                sucesso: false,
                erro: error.message
            };
            integracao.status = 'erro';
        }
        
        await integracao.save();
        
        res.json({
            success: resultadoTeste.sucesso,
            message: resultadoTeste.sucesso ? 'Teste realizado com sucesso' : 'Falha no teste de conexão',
            data: resultadoTeste
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao testar integração',
            error: error.message
        });
    }
});

// GET /api/integracao-fornecedores/:id/logs
router.get('/:id/logs', async (req, res) => {
    try {
        const LogSincronizacao = require('../models/LogSincronizacao');
        const { limite = 20, pagina = 1 } = req.query;
        
        const logs = await LogSincronizacao.find({ integracaoId: req.params.id })
            .populate('usuarioId', 'nome')
            .sort({ dataInicio: -1 })
            .limit(parseInt(limite))
            .skip((parseInt(pagina) - 1) * parseInt(limite));
        
        const total = await LogSincronizacao.countDocuments({ integracaoId: req.params.id });
        
        res.json({
            success: true,
            data: {
                logs,
                total,
                pagina: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite))
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar logs',
            error: error.message
        });
    }
});

// GET /api/integracao-fornecedores/dashboard/estatisticas
router.get('/dashboard/estatisticas', async (req, res) => {
    try {
        const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
        
        // Estatísticas gerais
        const stats = await IntegracaoFornecedor.aggregate([
            {
                $group: {
                    _id: null,
                    totalIntegracoes: { $sum: 1 },
                    integracoesAtivas: {
                        $sum: { $cond: [{ $eq: ['$ativo', true] }, 1, 0] }
                    },
                    integracoesComErro: {
                        $sum: { $cond: [{ $eq: ['$status', 'erro'] }, 1, 0] }
                    },
                    totalSincronizacoes: { $sum: '$estatisticas.totalSincronizacoes' },
                    sucessos: { $sum: '$estatisticas.sucessos' },
                    erros: { $sum: '$estatisticas.erros' }
                }
            }
        ]);
        
        // Estatísticas por tipo
        const estatisticasTipo = await IntegracaoFornecedor.aggregate([
            { $match: { ativo: true } },
            {
                $group: {
                    _id: '$tipo',
                    quantidade: { $sum: 1 },
                    sucessos: { $sum: '$estatisticas.sucessos' },
                    erros: { $sum: '$estatisticas.erros' }
                }
            }
        ]);
        
        // Integrações pendentes
        const pendentes = await IntegracaoFornecedor.countDocuments({
            ativo: true,
            proximaSincronizacao: { $lte: new Date() },
            frequenciaSincronizacao: { $ne: 'manual' }
        });
        
        res.json({
            success: true,
            data: {
                geral: stats[0] || {},
                porTipo: estatisticasTipo,
                pendentes
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas',
            error: error.message
        });
    }
});

// POST /api/integracao-fornecedores/sincronizar-todas-pendentes
router.post('/sincronizar-todas-pendentes', async (req, res) => {
    try {
        const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
        
        const integracoesPendentes = await IntegracaoFornecedor.obterPendentes();
        
        const resultados = [];
        
        for (const integracao of integracoesPendentes) {
            try {
                // Aqui você chamaria o método de sincronização
                // const resultado = await IntegracaoFornecedorController.sincronizarFornecedor({ params: { integracaoId: integracao._id } }, res);
                
                resultados.push({
                    integracaoId: integracao._id,
                    fornecedor: integracao.fornecedorId.nome,
                    status: 'iniciado'
                });
                
            } catch (error) {
                resultados.push({
                    integracaoId: integracao._id,
                    fornecedor: integracao.fornecedorId.nome,
                    status: 'erro',
                    erro: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `${integracoesPendentes.length} sincronizações iniciadas`,
            data: resultados
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao sincronizar integrações pendentes',
            error: error.message
        });
    }
});

module.exports = router;