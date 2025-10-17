const cron = require('node-cron');
const { rotinasAutomaticas } = require('../controllers/funcionalidades');

// Executar verificação de estoque todo dia às 8h
cron.schedule('0 8 * * *', async () => {
  console.log('🔄 Executando verificação de estoque...');
  await rotinasAutomaticas.verificarEstoqueBaixo();
});

// Enviar lembretes de revisão toda segunda às 9h
cron.schedule('0 9 * * 1', async () => {
  console.log('🔄 Enviando lembretes de revisão...');
  const totalEnviados = await rotinasAutomaticas.lembreteRevisoes();
  console.log(`📨 ${totalEnviados} lembretes enviados`);
});

// Backup automático todo domingo às 2h
cron.schedule('0 2 * * 0', async () => {
  console.log('🔄 Executando backup automático...');
  await rotinasAutomaticas.backup();
});