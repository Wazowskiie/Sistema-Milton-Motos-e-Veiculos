const agendamentoController = {
  async criarAgendamento(req, res) {
    try {
      const { clienteId, tipoServico, dataHora, observacoes, moto } = req.body;
      
      const agendamento = new OrdemServico({
        cliente: clienteId,
        moto,
        servicos: [{
          tipo: tipoServico,
          descricao: observacoes,
          status: 'pendente'
        }],
        status: 'aberta',
        datas: {
          previsaoEntrega: new Date(dataHora)
        }
      });
      
      await agendamento.save();
      await agendamento.populate('cliente');
      
      res.status(201).json(agendamento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  async listarAgendamentos(req, res) {
    try {
      const { data, status } = req.query;
      const filtros = {};
      
      if (data) {
        const inicioData = new Date(data);
        const fimData = new Date(data);
        fimData.setDate(fimData.getDate() + 1);
        
        filtros['datas.previsaoEntrega'] = {
          $gte: inicioData,
          $lt: fimData
        };
      }
      
      if (status) {
        filtros.status = status;
      }
      
      const agendamentos = await OrdemServico.find(filtros)
        .populate('cliente', 'nome telefone')
        .sort({ 'datas.previsaoEntrega': 1 });
      
      res.json(agendamentos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async horariosDisponiveis(req, res) {
    try {
      const { data } = req.query;
      const dataConsulta = new Date(data);
      
      // Horários de funcionamento (8h às 18h)
      const horarios = [];
      for (let hora = 8; hora < 18; hora++) {
        horarios.push(`${hora.toString().padStart(2, '0')}:00`);
      }
      
      // Buscar agendamentos do dia
      const inicioData = new Date(dataConsulta);
      const fimData = new Date(dataConsulta);
      fimData.setDate(fimData.getDate() + 1);
      
      const agendamentos = await OrdemServico.find({
        'datas.previsaoEntrega': {
          $gte: inicioData,
          $lt: fimData
        },
        status: { $ne: 'cancelada' }
      });
      
      // Remover horários ocupados
      const horariosOcupados = agendamentos.map(ag => {
        const hora = ag.datas.previsaoEntrega.getHours();
        return `${hora.toString().padStart(2, '0')}:00`;
      });
      
      const horariosLivres = horarios.filter(h => !horariosOcupados.includes(h));
      
      res.json(horariosLivres);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = agendamentoController; 