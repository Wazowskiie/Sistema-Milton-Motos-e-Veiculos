const CodigoBarras = require('../models/CodigoBarras');
const Produto = require('../models/Produto');

class CodigoBarrasController {
    // Gerar código de barras para produto
    async gerarCodigoBarras(req, res) {
        try {
            const { produtoId, tipo = 'EAN13' } = req.body;

            const produto = await Produto.findById(produtoId);
            if (!produto) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Produto não encontrado' 
                });
            }

            // Gerar código baseado no tipo
            let codigo;
            switch (tipo.toUpperCase()) {
                case 'EAN13':
                    codigo = this.gerarEAN13();
                    break;
                case 'EAN8':
                    codigo = this.gerarEAN8();
                    break;
                case 'CODE128':
                    codigo = this.gerarCode128(produto.sku);
                    break;
                case 'CODE39':
                    codigo = this.gerarCode39(produto.sku);
                    break;
                default:
                    codigo = this.gerarEAN13();
            }

            // Salvar código de barras
            const codigoBarras = new CodigoBarras({
                produtoId,
                codigo,
                tipo,
                ativo: true,
                dataCriacao: new Date()
            });

            await codigoBarras.save();

            // Atualizar produto com código de barras
            await Produto.findByIdAndUpdate(produtoId, { 
                codigoBarras: codigo,
                tipoCodigoBarras: tipo 
            });

            res.json({
                success: true,
                message: 'Código de barras gerado com sucesso',
                data: {
                    codigo,
                    tipo,
                    produto: produto.nome
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar código de barras',
                error: error.message
            });
        }
    }

    // Buscar produto por código de barras
    async buscarPorCodigo(req, res) {
        try {
            const { codigo } = req.params;

            const produto = await Produto.findOne({ codigoBarras: codigo })
                .populate('fornecedor', 'nome');

            if (!produto) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado com este código'
                });
            }

            res.json({
                success: true,
                data: produto
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar produto',
                error: error.message
            });
        }
    }

    // Validar código de barras
    async validarCodigo(req, res) {
        try {
            const { codigo, tipo } = req.body;

            let valido = false;
            switch (tipo.toUpperCase()) {
                case 'EAN13':
                    valido = this.validarEAN13(codigo);
                    break;
                case 'EAN8':
                    valido = this.validarEAN8(codigo);
                    break;
                default:
                    valido = codigo.length > 0;
            }

            res.json({
                success: true,
                valido,
                codigo,
                tipo
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao validar código',
                error: error.message
            });
        }
    }

    // Métodos auxiliares para gerar códigos
    gerarEAN13() {
        let codigo = '';
        for (let i = 0; i < 12; i++) {
            codigo += Math.floor(Math.random() * 10);
        }
        
        // Calcular dígito verificador
        let soma = 0;
        for (let i = 0; i < 12; i++) {
            soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const digitoVerificador = (10 - (soma % 10)) % 10;
        
        return codigo + digitoVerificador;
    }

    gerarEAN8() {
        let codigo = '';
        for (let i = 0; i < 7; i++) {
            codigo += Math.floor(Math.random() * 10);
        }
        
        // Calcular dígito verificador
        let soma = 0;
        for (let i = 0; i < 7; i++) {
            soma += parseInt(codigo[i]) * (i % 2 === 0 ? 3 : 1);
        }
        const digitoVerificador = (10 - (soma % 10)) % 10;
        
        return codigo + digitoVerificador;
    }

    gerarCode128(sku) {
        return `128${sku.replace(/[^A-Za-z0-9]/g, '').substring(0, 10)}`;
    }

    gerarCode39(sku) {
        return `*${sku.replace(/[^A-Za-z0-9]/g, '').substring(0, 10).toUpperCase()}*`;
    }

    validarEAN13(codigo) {
        if (!/^\d{13}$/.test(codigo)) return false;
        
        let soma = 0;
        for (let i = 0; i < 12; i++) {
            soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const digitoCalculado = (10 - (soma % 10)) % 10;
        
        return digitoCalculado === parseInt(codigo[12]);
    }

    validarEAN8(codigo) {
        if (!/^\d{8}$/.test(codigo)) return false;
        
        let soma = 0;
        for (let i = 0; i < 7; i++) {
            soma += parseInt(codigo[i]) * (i % 2 === 0 ? 3 : 1);
        }
        const digitoCalculado = (10 - (soma % 10)) % 10;
        
        return digitoCalculado === parseInt(codigo[7]);
    }
}

module.exports = new CodigoBarrasController();