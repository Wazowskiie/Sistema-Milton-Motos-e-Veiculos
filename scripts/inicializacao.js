const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const config = require('../config/configuracao');

async function configuracaoInicial() {
  try {
    await mongoose.connect('mongodb://localhost:27017/milton_motos_pecas');
    console.log('Conectado ao MongoDB para configuração inicial');
    
    // Criar usuário administrador padrão
    const adminExists = await Usuario.findOne({ email: 'admin@miltonmotos.com' });
    
    if (!adminExists) {
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      const admin = new Usuario({
        nome: 'Administrador',
        email: 'admin@miltonmotos.com',
        senha: senhaHash,
        nivel: 'admin',
        ativo: true
      });
      
      await admin.save();
      console.log('Usuário administrador criado');
      console.log('Email: admin@miltonmotos.com');
      console.log('Senha: admin123');
      console.log('IMPORTANTE: Altere a senha após o primeiro login!');
    }
    
    // Criar diretórios necessários
    const diretorios = [
      '../public/pdfs',
      '../public/uploads',
      '../backups',
      '../logs'
    ];
    
    diretorios.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Diretório criado: ${fullPath}`);
      }
    });
    
    console.log('Configuração inicial concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('Erro na configuração inicial:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  configuracaoInicial();
}

module.exports = {
  PDFGenerator,
  notificacaoController,
  BackupManager,
  configuracaoInicial
};