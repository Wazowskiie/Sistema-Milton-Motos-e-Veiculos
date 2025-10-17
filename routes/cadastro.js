// routes/cadastro.js
const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

async function cadastrarUsuario(req, res) {
  const { nome, email, senha } = req.body;
  try {
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'Email já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const novo = await Usuario.create({ nome, email, senha: hash });

    const user = novo.toObject();
    delete user.senha;
    return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso', usuario: user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
}

router.post('/', cadastrarUsuario);          // POST /api/usuarios
router.post('/cadastro', cadastrarUsuario);  // POST /api/usuarios/cadastro

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ error: 'Usuário não encontrado' });
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(400).json({ error: 'Senha incorreta.' });

    const user = usuario.toObject();
    delete user.senha;
    return res.json({ usuario: user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

module.exports = router;
