// app.js - VERSÃO MÍNIMA QUE FUNCIONA
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão MongoDB
mongoose.connect('mongodb://localhost:27017/milton_motos_pecas')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro MongoDB:', err));

// Adicione após a conexão MongoDB
const produtoRoutes = require('./routes/produtoRoutes');
app.use('/api/produtos', produtoRoutes);

const usuarioRoutes = require('./routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);

const estoqueRoutes = require('./routes/estoqueavancadoRoute.js');
app.use('/api/estoque', estoqueRoutes);

const estoqueAvancadoRoutes = require('./routes/estoqueavancadoRoute');
app.use('/api/estoque-avancado', estoqueAvancadoRoutes);

app.use('/api/vendas', require('./routes/vendaRoutes'));





// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-cadastro.html'));
});




module.exports = app;