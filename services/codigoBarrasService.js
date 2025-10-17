const CodigoBarras = require('../models/CodigoBarras');
const Produto = require('../models/Produto');

class CodigoBarrasService {
    // Gerar código de barras automático para produto
    async gerarCodigoAutomatico(produtoId, tipo = 'EAN13') {
        try {
            const produto = await Produto.findById(produtoId);
            if (!produto) {
                throw new Error('Produto não encontrado');
            }

            // Verificar se já existe código ativo
            const codigoExistente = await CodigoBarras.obterCodigoAtivo(produtoId);
            if (codigoExistente) {
                return codigoExistente;
            }

            // Gerar novo código
            let codigo;
            let tentativas = 0;
            const maxTentativas = 10;

            do {
                codigo = this.gerarCodigo(tipo, produto);
                const existe = await CodigoBarras.findOne({ codigo });
                
                if (!existe) break;
                
                tentativas++;
                if (tentativas >= maxTentativas) {
                    throw new Error('Não foi possível gerar código único após várias tentativas');
                }
            } while (tentativas < maxTentativas);

            // Salvar código
            const novoCodigoBarras = new CodigoBarras({
                produtoId,
                codigo,
                tipo,
                ativo: true
            });

            await novoCodigoBarras.save();

            // Atualizar produto
            await Produto.findByIdAndUpdate(produtoId, {
                codigoBarras: codigo,
                tipoCodigoBarras: tipo
            });

            return novoCodigoBarras;

        } catch (error) {
            throw new Error(`Erro ao gerar código de barras: ${error.message}`);
        }
    }

    // Gerar códigos em lote para múltiplos produtos
    async gerarCodigosLote(produtoIds, tipo = 'EAN13') {
        const resultados = [];
        
        for (const produtoId of produtoIds) {
            try {
                const codigo = await this.gerarCodigoAutomatico(produtoId, tipo);
                resultados.push({
                    produtoId,
                    sucesso: true,
                    codigo: codigo.codigo
                });
            } catch (error) {
                resultados.push({
                    produtoId,
                    sucesso: false,
                    erro: error.message
                });
            }
        }

        return resultados;
    }

    // Métodos auxiliares para geração de códigos
    gerarCodigo(tipo, produto) {
        switch (tipo.toUpperCase()) {
            case 'EAN13':
                return this.gerarEAN13();
            case 'EAN8':
                return this.gerarEAN8();
            case 'CODE128':
                return this.gerarCode128(produto.sku);
            case 'CODE39':
                return this.gerarCode39(produto.sku);
            default:
                return this.gerarEAN13();
        }
    }

    gerarEAN13() {
        // Gerar 12 dígitos aleatórios
        let codigo = '789'; // Prefixo Brasil
        for (let i = 0; i < 9; i++) {
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
        let codigo = '78'; // Prefixo
        for (let i = 0; i < 5; i++) {
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
        return `C128${sku.replace(/[^A-Za-z0-9]/g, '').substring(0, 8).padEnd(8, '0')}`;
    }

    gerarCode39(sku) {
        return `*${sku.replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase().padEnd(8, '0')}*`;
    }

    // Validar código de barras
    async validarCodigo(codigo, tipo) {
        switch (tipo.toUpperCase()) {
            case 'EAN13':
                return this.validarEAN13(codigo);
            case 'EAN8':
                return this.validarEAN8(codigo);
            case 'CODE128':
                return /^C128[A-Z0-9]{8}$/.test(codigo);
            case 'CODE39':
                return /^\*[A-Z0-9]{8}\*$/.test(codigo);
            default:
                return false;
        }
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

module.exports = new CodigoBarrasService();