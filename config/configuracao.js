module.exports = {
  // Configurações de negócio
  negocio: {
    nomeEmpresa: 'Milton Motos e Peças',
    cnpj: '12.345.678/0001-00',
    endereco: 'Rua das Motos, 123 - Centro',
    telefone: '(85) 3333-4444',
    whatsapp: '(85) 99999-9999',
    email: 'contato@miltonmotos.com.br'
  },
  
  // Configurações de estoque
  estoque: {
    alertaEstoqueBaixo: 5,
    diasParaLembreteRevisao: 7,
    validadeOrcamento: 15, // dias
    margemLucroMinima: 20, // %
    descontoMaximo: 15 // %
  },
  
  // Configurações de fidelidade
  fidelidade: {
    pontoPorReal: 0.1, // 1 ponto a cada R$ 10
    niveis: {
      bronze: { min: 0, desconto: 0 },
      prata: { min: 500, desconto: 0.05 },
      ouro: { min: 1000, desconto: 0.10 }
    }
  },
  
  // Configurações de serviço
  oficina: {
    horarioAbertura: '08:00',
    horarioFechamento: '18:00',
    intervalosAtendimento: 60, // minutos
    garantiaServicos: 90, // dias
    garantiaPecas: 90 // dias
  },
  
  // APIs externas
  apis: {
    whatsapp: {
      provider: 'twilio', // ou 'ultramsg', 'chatapi'
      apiKey: process.env.WHATSAPP_API_KEY,
      phoneNumber: process.env.WHATSAPP_PHONE
    },
    email: {
      provider: 'nodemailer',
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
};