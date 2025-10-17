const Cliente = require('../models/Cliente');

const clienteController = {
  // Listar todos os clientes com paginação
  async listar(req, res) {
    try {
      const { page = 1, limit = 20, search = '', tipoCliente } = req.query;
      
      const filtros = { ativo: true };
      
      if (search) {
        filtros.$or = [
          { nome: { $regex: search, $options: 'i' } },
          { cpf: { $regex: search, $options: 'i' } },
          { cnpj: { $regex: search, $options: 'i' } },
          { telefone: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (tipoCliente) {
        filtros.tipoCliente = tipoCliente;
      }
      
      const clientes = await Cliente.find(filtros)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ dataCadastro: -1 });
      
      const total = await Cliente.countDocuments(filtros);
      
      res.json({
        clientes,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Buscar cliente por ID com histórico completo
  async buscarPorId(req, res) {
    try {
      const cliente = await Cliente.findById(req.params.id)
        .populate('historicoCompras.produto')
        .populate('historicoServicos');
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Criar novo cliente
  async criar(req, res) {
    try {
      const cliente = new Cliente(req.body);
      await cliente.save();
      res.status(201).json(cliente);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ error: 'CPF/CNPJ ou email já cadastrado' });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },
  
  // Atualizar cliente
  async atualizar(req, res) {
    try {
      const cliente = await Cliente.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
      );
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Adicionar moto ao cliente
  async adicionarMoto(req, res) {
    try {
      const cliente = await Cliente.findById(req.params.id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      cliente.motos.push(req.body);
      await cliente.save();
      
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Clientes com revisão próxima
  async revisoesPendentes(req, res) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 30); // próximos 30 dias
      
      const clientes = await Cliente.find({
        'historicoServicos.proximaRevisao': { $lte: dataLimite },
        ativo: true
      });
      
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = clienteController;