class SistemaMiltonMotos {
  constructor() {
    this.baseURL = '/api';
    this.init();
  }
  
  init() {
    this.carregarDashboard();
    this.configurarEventos();
    this.verificarNotificacoes();
  }
  
  // Dashboard principal
  async carregarDashboard() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/indicadores`);
      const dados = await response.json();
      
      this.atualizarIndicadores(dados.indicadores);
      this.criarGraficoVendas(dados.vendasCategoria);
    } catch (error) {
      this.mostrarErro('Erro ao carregar dashboard', error);
    }
  }
  
  atualizarIndicadores(indicadores) {
    document.getElementById('total-clientes').textContent = indicadores.totalClientes;
    document.getElementById('clientes-novos').textContent = indicadores.clientesNovosMes;
    document.getElementById('faturamento-mes').textContent = 
      `R$ ${indicadores.faturamentoMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('ordens-abertas').textContent = indicadores.ordensAbertas;
    document.getElementById('produtos-baixo-estoque').textContent = indicadores.produtosBaixoEstoque;
    document.getElementById('revisoes-pendentes').textContent = indicadores.revisoesPendentes;
    
    // Destacar alertas
    if (indicadores.produtosBaixoEstoque > 0) {
      document.getElementById('alerta-estoque').style.display = 'block';
    }
    
    if (indicadores.revisoesPendentes > 0) {
      document.getElementById('alerta-revisoes').style.display = 'block';
    }
  }
  
  // Sistema de busca inteligente
  async buscarProduto(termo) {
    try {
      const response = await fetch(`${this.baseURL}/produtos/buscar?q=${encodeURIComponent(termo)}`);
      const produtos = await response.json();
      
      const resultados = document.getElementById('resultados-busca');
      resultados.innerHTML = '';
      
      produtos.forEach(produto => {
        const item = this.criarItemProduto(produto);
        resultados.appendChild(item);
      });
      
      return produtos;
    } catch (error) {
      this.mostrarErro('Erro na busca', error);
    }
  }
  
  criarItemProduto(produto) {
    const div = document.createElement('div');
    div.className = 'produto-item';
    div.innerHTML = `
      <div class="produto-info">
        <h4>${produto.nome}</h4>
        <p class="produto-codigo">${produto.codigo}</p>
        <p class="produto-preco">R$ ${produto.precoVenda.toFixed(2)}</p>
        <p class="produto-estoque">Estoque: ${produto.estoqueAtual}</p>
      </div>
      <div class="produto-acoes">
        <button onclick="app.adicionarAoOrcamento('${produto._id}')" class="btn-adicionar">
          Adicionar
        </button>
        <button onclick="app.verDetalhes('${produto._id}')" class="btn-detalhes">
          Detalhes
        </button>
      </div>
    `;
    
    if (produto.estoqueAtual <= produto.estoqueMinimo) {
      div.classList.add('estoque-baixo');
    }
    
    return div;
  }
  
  // Sistema de orçamento
  async criarOrcamento(clienteId) {
    const orcamento = {
      cliente: clienteId,
      itens: this.itensOrcamento,
      observacoes: document.getElementById('observacoes-orcamento').value,
      dataValidade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    };
    
    try {
      const response = await fetch(`${this.baseURL}/orcamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orcamento)
      });
      
      const resultado = await response.json();
      this.mostrarSucesso('Orçamento criado com sucesso!');
      this.imprimirOrcamento(resultado.numero);
      
    } catch (error) {
      this.mostrarErro('Erro ao criar orçamento', error);
    }
  }
  
  // Agendamento automático
  async verificarHorariosDisponiveis(data) {
    try {
      const response = await fetch(`${this.baseURL}/agendamentos/horarios?data=${data}`);
      const horarios = await response.json();
      
      const select = document.getElementById('horario-agendamento');
      select.innerHTML = '<option value="">Selecione um horário</option>';
      
      horarios.forEach(horario => {
        const option = document.createElement('option');
        option.value = horario;
        option.textContent = horario;
        select.appendChild(option);
      });
      
    } catch (error) {
      this.mostrarErro('Erro ao carregar horários', error);
    }
  }
  
  // Notificações em tempo real
  async verificarNotificacoes() {
    try {
      const response = await fetch(`${this.baseURL}/notificacoes`);
      const notificacoes = await response.json();
      
      const container = document.getElementById('notificacoes');
      container.innerHTML = '';
      
      notificacoes.forEach(notif => {
        const div = document.createElement('div');
        div.className = `notificacao ${notif.tipo}`;
        div.innerHTML = `
          <div class="notif-icone">${this.getIconeNotificacao(notif.tipo)}</div>
          <div class="notif-conteudo">
            <p>${notif.mensagem}</p>
            <small>${this.formatarData(notif.data)}</small>
          </div>
          <button onclick="app.marcarLida('${notif._id}')" class="btn-fechar">×</button>
        `;
        container.appendChild(div);
      });
      
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }
  
  // Busca de compatibilidade
  async buscarCompatibilidade() {
    const marca = document.getElementById('moto-marca').value;
    const modelo = document.getElementById('moto-modelo').value;
    const ano = document.getElementById('moto-ano').value;
    
    if (!marca || !modelo || !ano) {
      this.mostrarAviso('Preencha todos os campos da moto');
      return;
    }
    
    try {
      const response = await fetch(
        `${this.baseURL}/integracao/compatibilidade?marca=${marca}&modelo=${modelo}&ano=${ano}`
      );
      const pecas = await response.json();
      
      this.mostrarPecasCompativeis(pecas);
    } catch (error) {
      this.mostrarErro('Erro na busca de compatibilidade', error);
    }
  }
  
  mostrarPecasCompativeis(pecas) {
    const container = document.getElementById('pecas-compativeis');
    container.innerHTML = '';
    
    if (pecas.length === 0) {
      container.innerHTML = '<p>Nenhuma peça compatível encontrada no estoque.</p>';
      return;
    }
    
    pecas.forEach(peca => {
      const div = document.createElement('div');
      div.className = 'peca-compativel';
      div.innerHTML = `
        <h4>${peca.nome}</h4>
        <p>Categoria: ${peca.categoria}</p>
        <p>Preço: R$ ${peca.precoVenda.toFixed(2)}</p>
        <p>Estoque: ${peca.estoqueAtual} unidades</p>
        <button onclick="app.adicionarAoOrcamento('${peca._id}')" class="btn-adicionar">
          Adicionar ao Orçamento
        </button>
      `;
      container.appendChild(div);
    });
  }
  
  // Configurar eventos da interface
  configurarEventos() {
    // Busca em tempo real
    const campoBusca = document.getElementById('busca-produto');
    if (campoBusca) {
      campoBusca.addEventListener('input', (e) => {
        clearTimeout(this.timeoutBusca);
        this.timeoutBusca = setTimeout(() => {
          if (e.target.value.length >= 3) {
            this.buscarProduto(e.target.value);
          }
        }, 300);
      });
    }
    
    // Data de agendamento
    const dataAgendamento = document.getElementById('data-agendamento');
    if (dataAgendamento) {
      dataAgendamento.addEventListener('change', (e) => {
        this.verificarHorariosDisponiveis(e.target.value);
      });
    }
    
    // Auto-completar cliente
    const campoCliente = document.getElementById('cliente-busca');
    if (campoCliente) {
      campoCliente.addEventListener('input', (e) => {
        this.autoCompletarCliente(e.target.value);
      });
    }
  }
  
  // Utilitários
  getIconeNotificacao(tipo) {
    const icones = {
      'estoque': '📦',
      'revisao': '🔧',
      'venda': '💰',
      'alerta': '⚠️',
      'info': 'ℹ️'
    };
    return icones[tipo] || 'ℹ️';
  }
  
  formatarData(data) {
    return new Date(data).toLocaleString('pt-BR');
  }
  
  mostrarSucesso(mensagem) {
    this.mostrarToast(mensagem, 'sucesso');
  }
  
  mostrarErro(titulo, erro) {
    console.error(titulo, erro);
    this.mostrarToast(`${titulo}: ${erro.message || erro}`, 'erro');
  }
  
  mostrarAviso(mensagem) {
    this.mostrarToast(mensagem, 'aviso');
  }
  
  mostrarToast(mensagem, tipo) {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

// Inicializar aplicação
const app = new SistemaMiltonMotos();

// Funcões globais para os botões
function adicionarAoOrcamento(produtoId) {
  app.adicionarAoOrcamento(produtoId);
}

function verDetalhes(produtoId) {
  app.verDetalhes(produtoId);
}

function marcarLida(notificacaoId) {
  app.marcarLida(notificacaoId);
}