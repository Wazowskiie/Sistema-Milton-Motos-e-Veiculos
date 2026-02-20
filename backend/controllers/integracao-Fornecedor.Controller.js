const IntegracaoFornecedor = require('../models/integracao-fornecedor');
const Fornecedor = require('../models/Fornecedor');
const Produto = require('../models/Produto');
const axios = require('axios');
const xml2js = require('xml2js');
const csv = require('csv-parser');
const fs = require('fs');

class IntegracaoFornecedorController {
    // Configurar integração com fornecedor
    async configurarIntegracao(req, res) {
        try {
            const { 
                fornecedorId, 
                tipo, 
                configuracao,
                ativo = true,
                frequenciaSincronizacao = 'diario'
            } = req.body;

            const fornecedor = await Fornecedor.findById(fornecedorId);
            if (!fornecedor) {
                return res.status(404).json({
                    success: false,
                    message: 'Fornecedor não encontrado'
                });
            }

            // Validar configuração baseada no tipo
            const configValida = this.validarConfiguracao(tipo, configuracao);
            if (!configValida.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Configuração inválida',
                    errors: configValida.errors
                });
            }

            const integracao = new IntegracaoFornecedor({
                fornecedorId,
                tipo,
                configuracao,
                ativo,
                frequenciaSincronizacao,
                ultimaSincronizacao: null,
                proximaSincronizacao: this.calcularProximaSincronizacao(frequenciaSincronizacao),
                status: 'configurado',
                dataCriacao: new Date()
            });

            await integracao.save();

            res.json({
                success: true,
                message: 'Integração configurada com sucesso',
                data: integracao
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao configurar integração',
                error: error.message
            });
        }
    }

    // Sincronizar dados com fornecedor
    async sincronizarFornecedor(req, res) {
        try {
            const { integracaoId } = req.params;

            const integracao = await IntegracaoFornecedor.findById(integracaoId)
                .populate('fornecedorId');

            if (!integracao) {
                return res.status(404).json({
                    success: false,
                    message: 'Integração não encontrada'
                });
            }

            if (!integracao.ativo) {
                return res.status(400).json({
                    success: false,
                    message: 'Integração inativa'
                });
            }

            // Atualizar status para sincronizando
            await IntegracaoFornecedor.findByIdAndUpdate(integracaoId, {
                status: 'sincronizando',
                ultimaSincronizacao: new Date()
            });

            let resultado;

            switch (integracao.tipo) {
                case 'api':
                    resultado = await this.sincronizarAPI(integracao);
                    break;
                case 'xml':
                    resultado = await this.sincronizarXML(integracao);
                    break;
                case 'csv':
                    resultado = await this.sincronizarCSV(integracao);
                    break;
                case 'email':
                    resultado = await this.sincronizarEmail(integracao);
                    break;
                default:
                    throw new Error('Tipo de integração não suportado');
            }

            // Atualizar status e próxima sincronização
            await IntegracaoFornecedor.findByIdAndUpdate(integracaoId, {
                status: 'sucesso',
                proximaSincronizacao: this.calcularProximaSincronizacao(integracao.frequenciaSincronizacao),
                ultimoResultado: resultado
            });

            res.json({
                success: true,
                message: 'Sincronização realizada com sucesso',
                data: resultado
            });

        } catch (error) {
            // Atualizar status para erro
            if (req.params.integracaoId) {
                await IntegracaoFornecedor.findByIdAndUpdate(req.params.integracaoId, {
                    status: 'erro',
                    ultimoErro: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Erro na sincronização',
                error: error.message
            });
        }
    }

    // Sincronização via API REST
    async sincronizarAPI(integracao) {
        const { url, headers, metodo = 'GET', auth } = integracao.configuracao;
        
        const config = {
            method: metodo,
            url: url,
            headers: headers || {}
        };

        if (auth) {
            if (auth.tipo === 'bearer') {
                config.headers.Authorization = `Bearer ${auth.token}`;
            } else if (auth.tipo === 'basic') {
                config.auth = {
                    username: auth.username,
                    password: auth.password
                };
            }
        }

        const response = await axios(config);
        const dados = response.data;

        return await this.processarDadosFornecedor(dados, integracao.fornecedorId);
    }

    // Sincronização via XML
    async sincronizarXML(integracao) {
        const { url, campoMapeamento } = integracao.configuracao;
        
        const response = await axios.get(url);
        const parser = new xml2js.Parser();
        const dados = await parser.parseStringPromise(response.data);

        // Navegar pelos dados XML baseado no mapeamento
        let produtosDados = dados;
        if (campoMapeamento.caminhoProdutos) {
            const caminho = campoMapeamento.caminhoProdutos.split('.');
            for (const parte of caminho) {
                produtosDados = produtosDados[parte];
            }
        }

        return await this.processarDadosFornecedor(produtosDados, integracao.fornecedorId);
    }

    // Sincronização via CSV
    async sincronizarCSV(integracao) {
        const { url, delimitador = ',', mapeamentoCampos } = integracao.configuracao;
        
        const response = await axios.get(url);
        const dados = [];

        return new Promise((resolve, reject) => {
            const stream = require('stream');
            const readable = new stream.Readable();
            readable.push(response.data);
            readable.push(null);

            readable
                .pipe(csv({ separator: delimitador }))
                .on('data', (row) => {
                    // Mapear campos conforme configuração
                    const produtoMapeado = {};
                    for (const [campoSistema, campoCSV] of Object.entries(mapeamentoCampos)) {
                        produtoMapeado[campoSistema] = row[campoCSV];
                    }
                    dados.push(produtoMapeado);
                })
                .on('end', async () => {
                    try {
                        const resultado = await this.processarDadosFornecedor(dados, integracao.fornecedorId);
                        resolve(resultado);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });
    }

    // Processar dados recebidos do fornecedor
    async processarDadosFornecedor(dados, fornecedorId) {
        let processados = 0;
        let atualizados = 0;
        let criados = 0;
        let erros = 0;

        for (const item of dados) {
            try {
                // Buscar produto por SKU ou código do fornecedor
                let produto = await Produto.findOne({
                    $or: [
                        { sku: item.sku },
                        { codigoFornecedor: item.codigo },
                        { codigoBarras: item.codigoBarras }
                    ]
                });

                const dadosProduto = {
                    nome: item.nome || item.descricao,
                    sku: item.sku,
                    preco: parseFloat(item.preco) || 0,
                    precoFornecedor: parseFloat(item.precoFornecedor) || parseFloat(item.preco) || 0,
                    quantidadeDisponivel: parseInt(item.quantidade) || 0,
                    codigoFornecedor: item.codigo,
                    fornecedor: fornecedorId,
                    categoria: item.categoria,
                    descricao: item.descricao,
                    dataUltimaAtualizacao: new Date()
                };

                if (produto) {
                    // Atualizar produto existente
                    await Produto.findByIdAndUpdate(produto._id, dadosProduto);
                    atualizados++;
                } else {
                    // Criar novo produto
                    produto = new Produto(dadosProduto);
                    await produto.save();
                    criados++;
                }

                processados++;

            } catch (error) {
                console.error(`Erro ao processar produto: ${error.message}`);
                erros++;
            }
        }

        return {
            totalProcessados: processados,
            atualizados,
            criados,
            erros,
            dataProcessamento: new Date()
        };
    }

    // Listar integrações
    async listarIntegracoes(req, res) {
        try {
            const { fornecedorId, ativo } = req.query;
            
            let query = {};
            if (fornecedorId) query.fornecedorId = fornecedorId;
            if (ativo !== undefined) query.ativo = ativo === 'true';

            const integracoes = await IntegracaoFornecedor.find(query)
                .populate('fornecedorId', 'nome cnpj')
                .sort({ dataCriacao: -1 });

            res.json({
                success: true,
                data: integracoes
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao listar integrações',
                error: error.message
            });
        }
    }

    // Métodos auxiliares
    validarConfiguracao(tipo, configuracao) {
        const errors = [];

        switch (tipo) {
            case 'api':
                if (!configuracao.url) errors.push('URL é obrigatória');
                break;
            case 'xml':
                if (!configuracao.url) errors.push('URL é obrigatória');
                if (!configuracao.campoMapeamento) errors.push('Mapeamento de campos é obrigatório');
                break;
            case 'csv':
                if (!configuracao.url) errors.push('URL é obrigatória');
                if (!configuracao.mapeamentoCampos) errors.push('Mapeamento de campos é obrigatório');
                break;
            case 'email':
                if (!configuracao.servidor) errors.push('Servidor de email é obrigatório');
                break;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    calcularProximaSincronizacao(frequencia) {
        const agora = new Date();
        switch (frequencia) {
            case 'horario':
                return new Date(agora.getTime() + 60 * 60 * 1000);
            case 'diario':
                return new Date(agora.getTime() + 24 * 60 * 60 * 1000);
            case 'semanal':
                return new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'mensal':
                const proximoMes = new Date(agora);
                proximoMes.setMonth(proximoMes.getMonth() + 1);
                return proximoMes;
            default:
                return new Date(agora.getTime() + 24 * 60 * 60 * 1000);
        }
    }
}

module.exports = new IntegracaoFornecedorController();