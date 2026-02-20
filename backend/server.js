require('dotenv').config();
const app = require('./app');
const conectarDB = require('./config/database');

const PORT = process.env.PORT || 5000;

(async () => {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
})();