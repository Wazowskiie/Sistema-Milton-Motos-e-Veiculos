const validacaoMiddleware = {
  validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  },
  
  validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14) return false;
    
    // Lógica de validação do CNPJ
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos.charAt(1));
  },
  
  validarCliente(req, res, next) {
    const { cpf, cnpj, email, telefone, tipoCliente } = req.body;
    
    if (tipoCliente === 'fisico' && cpf && !this.validarCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }
    
    if (tipoCliente === 'juridico' && cnpj && !this.validarCNPJ(cnpj)) {
      return res.status(400).json({ error: 'CNPJ inválido' });
    }
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    if (!telefone || telefone.length < 10) {
      return res.status(400).json({ error: 'Telefone inválido' });
    }
    
    next();
  }
};
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }
    next();
};

const validationMiddleware = {
    // Validação para gerar código de barras
    validarGerarCodigoBarras: [
        body('produtoId')
            .notEmpty()
            .withMessage('ID do produto é obrigatório')
            .isMongoId()
            .withMessage('ID do produto inválido'),
        body('tipo')
            .optional()
            .isIn(['EAN13', 'EAN8', 'CODE128', 'CODE39', 'UPC'])
            .withMessage('Tipo de código de barras inválido'),
        handleValidationErrors
    ],

    // Validação para código de barras
    validarCodigoBarras: [
        body('codigo')
            .notEmpty()
            .withMessage('Código é obrigatório')
            .isLength({ min: 5, max: 20 })
            .withMessage('Código deve ter entre 5 e 20 caracteres'),
        body('tipo')
            .notEmpty()
            .withMessage('Tipo é obrigatório')
            .isIn(['EAN13', 'EAN8', 'CODE128', 'CODE39', 'UPC'])
            .withMessage('Tipo de código inválido'),
        handleValidationErrors
    ],

    // Validação para atualização de preço
    validarAtualizacaoPreco: [
        body('produtoId')
            .notEmpty()
            .withMessage('ID do produto é obrigatório')
            .isMongoId()
            .withMessage('ID do produto inválido'),
        body('novoPreco')
            .notEmpty()
            .withMessage('Novo preço é obrigatório')
            .isFloat({ min: 0 })
            .withMessage('Preço deve ser um número positivo'),
        body('motivo')
            .notEmpty()
            .withMessage('Motivo é obrigatório')
            .isIn([
                'ajuste_custo',
                'promocao', 
                'sazonalidade',
                'concorrencia',
                'margem_lucro',
                'inflacao',
                'desconto_volume',
                'lancamento',
                'descontinuacao',
                'outros'
            ])
            .withMessage('Motivo inválido'),
        body('observacoes')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Observações devem ter no máximo 500 caracteres'),
        handleValidationErrors
    ],

    // Validação para configuração de integração
    validarConfiguracaoIntegracao: [
        body('fornecedorId')
            .notEmpty()
            .withMessage('ID do fornecedor é obrigatório')
            .isMongoId()
            .withMessage('ID do fornecedor inválido'),
        body('tipo')
            .notEmpty()
            .withMessage('Tipo de integração é obrigatório')
            .isIn(['api', 'xml', 'csv', 'json', 'email', 'ftp', 'webhook'])
            .withMessage('Tipo de integração inválido'),
        body('configuracao')
            .notEmpty()
            .withMessage('Configuração é obrigatória')
            .isObject()
            .withMessage('Configuração deve ser um objeto'),
        body('configuracao.url')
            .if(body('tipo').isIn(['api', 'xml', 'csv', 'json']))
            .notEmpty()
            .withMessage('URL é obrigatória para este tipo de integração')
            .isURL()
            .withMessage('URL inválida'),
        body('frequenciaSincronizacao')
            .optional()
            .isIn(['manual', 'tempo_real', 'horaria', 'diaria', 'semanal', 'mensal'])
            .withMessage('Frequência de sincronização inválida'),
        body('horarioSincronizacao')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .withMessage('Horário deve estar no formato HH:MM'),
        handleValidationErrors
    ],

    // Validação para parâmetros de consulta comuns
    validarConsultaPaginada: [
        query('pagina')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Página deve ser um número inteiro positivo'),
        query('limite')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limite deve ser entre 1 e 100'),
        handleValidationErrors
    ],

    // Validação para datas
    validarPeriodoDatas: [
        query('dataInicio')
            .optional()
            .isISO8601()
            .withMessage('Data de início inválida'),
        query('dataFim')
            .optional()
            .isISO8601()
            .withMessage('Data de fim inválida'),
        handleValidationErrors
    ]
};

module.exports = validationMiddleware;