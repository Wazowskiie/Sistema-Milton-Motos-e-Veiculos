const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario.js');

const usuarioController = {
  // Registrar novo usuário
  async registrar(req, res) {
    try {
      const { nome, email, senha, nivel = 'funcionario' } = req.body;
      
      // Verificar se usuário já existe
      const usuarioExiste = await Usuario.findOne({ email });
      if (usuarioExiste) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      
      // Criptografar senha
      const senhaHash = await bcrypt.hash(senha, 10);
      
      const usuario = new Usuario({
        nome,
        email,
        senha: senhaHash,
        nivel,
        ativo: true
      });
      
      await usuario.save();
      
      // Não retornar a senha
      const { senha: _, ...usuarioSemSenha } = usuario.toObject();
      
      res.status(201).json({
        message: 'Usuário criado com sucesso',
        usuario: usuarioSemSenha
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, senha } = req.body;
      
      // Buscar usuário
      const usuario = await Usuario.findOne({ email, ativo: true });
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: usuario._id, email: usuario.email, nivel: usuario.nivel },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );
      
      // Atualizar último login
      usuario.ultimoLogin = new Date();
      await usuario.save();
      
      const { senha: _, ...usuarioSemSenha } = usuario.toObject();
      
      res.json({
        message: 'Login realizado com sucesso',
        token,
        usuario: usuarioSemSenha
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Listar usuários
  async listar(req, res) {
    try {
      const usuarios = await Usuario.find({ ativo: true })
        .select('-senha')
        .sort({ dataCriacao: -1 });
      
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Buscar usuário por ID
  async buscarPorId(req, res) {
    try {
      const usuario = await Usuario.findById(req.params.id).select('-senha');
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar usuário
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, nivel, ativo } = req.body;
      
      const usuario = await Usuario.findByIdAndUpdate(
        id,
        { nome, email, nivel, ativo },
        { new: true, runValidators: true }
      ).select('-senha');
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      res.json(usuario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Alterar senha
  async alterarSenha(req, res) {
    try {
      const { id } = req.params;
      const { senhaAtual, novaSenha } = req.body;
      
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
      
      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      usuario.senha = novaSenhaHash;
      
      await usuario.save();
      
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = usuarioController;