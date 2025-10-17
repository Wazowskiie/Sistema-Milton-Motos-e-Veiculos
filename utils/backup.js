const { exec } = require('child_process');
const path = require('path');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.ensureBackupDir();
  }
  
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  async criarBackup() {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const backupFile = path.join(this.backupDir, `backup_${timestamp}.gz`);
      
      const comando = `mongodump --db milton_motos_pecas --archive=${backupFile} --gzip`;
      
      exec(comando, (error, stdout, stderr) => {
        if (error) {
          console.error('Erro no backup:', error);
          reject(error);
        } else {
          console.log('Backup criado:', backupFile);
          this.limparBackupsAntigos();
          resolve(backupFile);
        }
      });
    });
  }
  
  limparBackupsAntigos() {
    // Manter apenas os últimos 30 backups
    const arquivos = fs.readdirSync(this.backupDir)
      .filter(file => file.startsWith('backup_'))
      .map(file => ({
        nome: file,
        path: path.join(this.backupDir, file),
        data: fs.statSync(path.join(this.backupDir, file)).mtime
      }))
      .sort((a, b) => b.data - a.data);
    
    if (arquivos.length > 30) {
      arquivos.slice(30).forEach(arquivo => {
        fs.unlinkSync(arquivo.path);
        console.log('Backup antigo removido:', arquivo.nome);
      });
    }
  }
  
  async restaurarBackup(nomeArquivo) {
    return new Promise((resolve, reject) => {
      const backupFile = path.join(this.backupDir, nomeArquivo);
      
      if (!fs.existsSync(backupFile)) {
        reject(new Error('Arquivo de backup não encontrado'));
        return;
      }
      
      const comando = `mongorestore --db milton_motos_pecas_restore --archive=${backupFile} --gzip`;
      
      exec(comando, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          console.log('Backup restaurado com sucesso');
          resolve(true);
        }
      });
    });
  }
}