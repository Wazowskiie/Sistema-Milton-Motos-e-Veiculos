const alertaController = {
  // Listar alertas com filtros
  async listar(req, res) {
    try {
      const { 
        tipo, 
        prioridade, 
        status = 'pendente', 
        page = 1, 
        limit = 20 
      } = req.query;
      
      const filtros = {};
      if (tipo) filtros.tipo = tipo;
      if (prioridade) filtros.prioridade = prioridade;
      if (status) filtros.status = status;
      
      const alertas = await Alerta.find(filtros)
        .populate('produto', 'nome codigo estoqueAtual')
        .populate('resolvidoPor', 'nome')
        .sort({ prioridade: -1, dataCriacao: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Alerta.countDocuments(filtros);
      
      // Contar alertas por prioridade
      const resumo = await Alerta.aggregate([
        { $match: { status: { $in: ['pendente', 'visualizado'] } } },
        { 
          $group: {
            _id: '$prioridade',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const contadores = resumo.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      
      res.json({
        alertas,
        paginacao: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        resumo: {
          criticos: contadores.critica || 0,
          altos: contadores.alta || 0,
          medios: contadores.media || 0,
          baixos: contadores.baixa || 0,
          total: Object.values(contadores).reduce((sum, val) => sum + val, 0)
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Marcar alerta como visualizado
  async marcarVisualizado(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      
      const alerta = await Alerta.findById(id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      
      // Verificar se já foi visualizado pelo usuário
      const jaVisualizado = alerta.visualizadoPor.some(
        v => v.usuario.toString() === usuarioId
      );
      
      if (!jaVisualizado) {
        alerta.visualizadoPor.push({
          usuario: usuarioId,
          data: new Date()
        });
        
        if (alerta.status === 'pendente') {
          alerta.status = 'visualizado';
        }
        
        await alerta.save();
      }
      
      res.json({ message: 'Alerta marcado como visualizado' });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Resolver alerta
  async resolver(req, res) {
    try {
      const { id } = req.params;
      const { observacao } = req.body;
      const usuarioId = req.user?.id;
      
      const alerta = await Alerta.findByIdAndUpdate(
        id,
        {
          status: 'resolvido',
          resolvidoPor: usuarioId,
          dataResolucao: new Date(),
          observacao
        },
        { new: true }
      ).populate('produto', 'nome codigo');
      
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      
      res.json({ 
        message: 'Alerta resolvido com sucesso',
        alerta
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Dashboard de alertas
  async dashboard(req, res) {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      const estatisticas = await Promise.all([
        // Alertas por tipo no mês
        Alerta.aggregate([
          { $match: { dataCriacao: { $gte: inicioMes } } },
          { $group: { _id: '$tipo', total: { $sum: 1 } } }
        ]),
        
        // Alertas por prioridade (pendentes)
        Alerta.aggregate([
          { $match: { status: { $in: ['pendente', 'visualizado'] } } },
          { $group: { _id: '$prioridade', total: { $sum: 1 } } }
        ]),
        
        // Top 10 produtos com mais alertas
        Alerta.aggregate([
          { 
            $match: { 
              produto: { $exists: true },
              dataCriacao: { $gte: inicioMes }
            }
          },
          { $group: { _id: '$produto', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'produtos',
              localField: '_id',
              foreignField: '_id',
              as: 'produto'
            }
          },
          { $unwind: '$produto' },
          {
            $project: {
              nome: '$produto.nome',
              codigo: '$produto.codigo',
              totalAlertas: '$total'
            }
          }
        ]),
        
        // Alertas resolvidos vs pendentes
        Alerta.aggregate([
          { $match: { dataCriacao: { $gte: inicioMes } } },
          { $group: { _id: '$status', total: { $sum: 1 } } }
        ])
      ]);
      
      res.json({
        alertasPorTipo: estatisticas[0],
        alertasPorPrioridade: estatisticas[1],
        topProdutos: estatisticas[2],
        statusGeral: estatisticas[3]
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};