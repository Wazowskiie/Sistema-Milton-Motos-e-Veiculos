const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha obrigatórios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha inválida' });
    }

    const token = jwt.sign(
      { id: usuario._id },
      process.env.JWT_SECRET || 'segredo_temporario',
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (err) {
    console.error('ERRO LOGIN:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// CADASTRO
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);
const usuario = await Usuario.create({ nome, email, senha: hash });

const token = jwt.sign(
  { id: usuario._id },
  process.env.JWT_SECRET || 'segredo_temporario',
  { expiresIn: '8h' }
);

return res.status(201).json({
  ok: true,
  token,
  usuario: {
    id: usuario._id,
    nome: usuario.nome,
    email: usuario.email
  }
});

  } catch (err) {
    console.error('ERRO CADASTRO:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

module.exports = router;