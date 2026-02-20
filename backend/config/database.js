const mongoose = require('mongoose');

module.exports = async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Erro ao conectar no MongoDB', err);
    process.exit(1);
  }
};
