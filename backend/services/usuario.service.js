const Usuario = require('../../models/Usuario');
const bcrypt = require('bcryptjs');

class UsuarioService {
  static async cadastrar(dados) {
    const existe = await Usuario.findOne({ email: dados.email });
    if (existe) throw new Error('Usuário já cadastrado');

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    return Usuario.create({
      nome: dados.nome,
      email: dados.email,
      senha: senhaHash
    });
  }

  static async listar() {
    return Usuario.find().select('-senha');
  }
}

module.exports = UsuarioService;
