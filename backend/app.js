const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Frontend estático ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas da API ─────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.Routes'));
app.use('/api/clientes',      require('./routes/cliente.Routes'));
app.use('/api/mecanicos',     require('./routes/mecanicos.Routes'));
app.use('/api/ordens-servico',require('./routes/ordens.Routes'));
app.use('/api/produtos',      require('./routes/produto.Routes'));
app.use('/api/vendas',        require('./routes/venda.Routes'));
app.use('/api/dashboard',     require('./routes/dashboard.Routes'));

// ── Rota raiz → login ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-cadastro.html'));
});

module.exports = app;
