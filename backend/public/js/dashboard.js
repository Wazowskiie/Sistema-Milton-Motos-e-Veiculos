let token = localStorage.getItem('token');
if (!token) location.href = 'login-cadastro.html';

/* ===============================
   ELEMENTOS DO DASHBOARD
================================ */
const lista = document.getElementById('lista');
const clienteSelect = document.getElementById('cliente');
const mecanicoSelect = document.getElementById('mecanico');
const form = document.getElementById('formOrdem');

// KPIs
const kpiEstoque = document.getElementById('kpi-estoque');
const kpiVendas = document.getElementById('kpi-vendas');
const kpiMediaDias = document.getElementById('kpi-media-dias');
const kpiAvaliacoes = document.getElementById('kpi-avaliacoes');

if (!lista) console.warn('Lista de ordens não encontrada (ok se não existir)');
if (!kpiEstoque) console.warn('KPIs não encontrados no HTML');

/* ===============================
   DASHBOARD - KPIs REAIS
================================ */
async function carregarDashboard() {
  try {
    // 🔹 PRODUTOS / ESTOQUE
    const resProdutos = await fetch('/api/produtos', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const produtos = await resProdutos.json();

    const totalEstoque = produtos.reduce(
      (soma, p) => soma + Number(p.estoque || 0),
      0
    );

    if (kpiEstoque) kpiEstoque.textContent = totalEstoque;

    // 🔹 VENDAS DO MÊS
    const resVendas = await fetch('/api/vendas', {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (resVendas.ok) {
      const vendas = await resVendas.json();
      const totalVendas = vendas.reduce(
        (soma, v) => soma + Number(v.valor || 0),
        0
      );

      if (kpiVendas)
        kpiVendas.textContent = `R$ ${totalVendas.toFixed(2)}`;
    } else {
      if (kpiVendas) kpiVendas.textContent = 'R$ 0';
    }

    // 🔹 MÉDIA DE DIAS NO ESTOQUE (placeholder correto por enquanto)
    if (kpiMediaDias) kpiMediaDias.textContent = '—';

    // 🔹 AVALIAÇÕES (ainda não implementado)
    if (kpiAvaliacoes) kpiAvaliacoes.textContent = 0;

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

/* ===============================
   ORDENS DE SERVIÇO (SEU CÓDIGO)
================================ */
async function carregarSelects() {
  if (!clienteSelect || !mecanicoSelect) return;

  const [clientes, mecanicos] = await Promise.all([
    fetch('/api/clientes', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json()),

    fetch('/api/mecanicos', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json())
  ]);

  clienteSelect.innerHTML = '<option value="">Cliente</option>';
  mecanicoSelect.innerHTML = '<option value="">Mecânico</option>';

  clientes.forEach(c => {
    clienteSelect.innerHTML += `<option value="${c._id}">${c.nome}</option>`;
  });

  mecanicos.forEach(m => {
    mecanicoSelect.innerHTML += `<option value="${m._id}">${m.nome}</option>`;
  });
}

async function carregar() {
  if (!lista) return;

  const res = await fetch('/api/ordens-servico', {
    headers: { Authorization: 'Bearer ' + token }
  });

  const dados = await res.json();
  lista.innerHTML = '';

  dados.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.cliente?.nome || '-'}</td>
      <td>${o.mecanico?.nome || '-'}</td>
      <td>${o.descricao}</td>
      <td>R$ ${Number(o.valor || 0).toFixed(2)}</td>
      <td>${o.status}</td>
      <td>
        <button onclick="excluir('${o._id}')">🗑️</button>
      </td>
    `;
    lista.appendChild(tr);
  });
}

if (form) {
  form.onsubmit = async e => {
    e.preventDefault();

    await fetch('/api/ordens-servico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        cliente: clienteSelect.value,
        mecanico: mecanicoSelect.value,
        descricao: descricao.value,
        valor: valor.value
      })
    });

    form.reset();
    carregar();
    carregarDashboard(); // 🔹 atualiza KPIs após nova ordem
  };
}

async function excluir(id) {
  if (!confirm('Excluir ordem?')) return;

  await fetch('/api/ordens-servico/' + id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });


  async function excluirProduto(id) {
  if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`/api/produtos/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    if (!res.ok) {
      alert('Erro ao excluir produto');
      return;
    }

    alert('Produto excluído com sucesso!');
    carregarPecas();

  } catch (err) {
    console.error(err);
    alert('Erro ao excluir produto');
  }
}

async function editarProduto(id) {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`/api/produtos/${id}`, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    const produto = await res.json();

    // Preenche o formulário
    document.getElementById('nome').value = produto.nome;
    document.getElementById('tipo').value = produto.tipo;
    document.getElementById('descricao').value = produto.descricao || '';
    document.getElementById('preco').value = produto.preco;
    document.getElementById('estoque').value = produto.estoque;

    // Guarda o ID do produto em edição
    document.getElementById('formProduto').dataset.editando = id;

    // Abre o modal
    abrirModalProduto();

  } catch (err) {
    console.error(err);
    alert('Erro ao carregar produto');
  }
}

  carregar();
  carregarDashboard();
}

/* ===============================
   INICIALIZAÇÃO
================================ */
document.addEventListener('DOMContentLoaded', () => {
  carregarDashboard();
  carregarSelects();
  carregar();
});