const token = localStorage.getItem('token');
if (!token) location.href = 'login-cadastro.html';

// ── Elementos ────────────────────────────────────────────────
const lista         = document.getElementById('lista');
const clienteSelect = document.getElementById('cliente');
const mecanicoSelect= document.getElementById('mecanico');
const form          = document.getElementById('formOrdem');

const kpiEstoque    = document.getElementById('kpi-estoque');
const kpiVendas     = document.getElementById('kpi-vendas');
const kpiMediaDias  = document.getElementById('kpi-media-dias');
const kpiAvaliacoes = document.getElementById('kpi-avaliacoes');

const headers = {
  Authorization: 'Bearer ' + token,
  'Content-Type': 'application/json'
};

// ── KPIs ─────────────────────────────────────────────────────
async function carregarDashboard() {
  try {
    const resProdutos = await fetch('/api/produtos', { headers });
    if (resProdutos.ok) {
      const produtos = await resProdutos.json();
      const totalEstoque = produtos.reduce((s, p) => s + Number(p.estoque || 0), 0);
      if (kpiEstoque) kpiEstoque.textContent = totalEstoque;
    }

    const resVendas = await fetch('/api/vendas', { headers });
    if (resVendas.ok) {
      const vendas = await resVendas.json();
      const totalVendas = vendas.reduce((s, v) => s + Number(v.total || v.valor || 0), 0);
      if (kpiVendas) kpiVendas.textContent = `R$ ${totalVendas.toFixed(2)}`;
    } else {
      if (kpiVendas) kpiVendas.textContent = 'R$ 0,00';
    }

    if (kpiMediaDias)  kpiMediaDias.textContent = '—';
    if (kpiAvaliacoes) kpiAvaliacoes.textContent = 0;

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

// ── Selects de Ordens de Serviço ─────────────────────────────
async function carregarSelects() {
  if (!clienteSelect || !mecanicoSelect) return;

  try {
    const [resC, resM] = await Promise.all([
      fetch('/api/clientes',  { headers }),
      fetch('/api/mecanicos', { headers })
    ]);

    if (resC.ok) {
      const clientes = await resC.json();
      clienteSelect.innerHTML = '<option value="">Cliente</option>';
      clientes.forEach(c => {
        clienteSelect.innerHTML += `<option value="${c._id}">${c.nome}</option>`;
      });
    }

    if (resM.ok) {
      const mecanicos = await resM.json();
      mecanicoSelect.innerHTML = '<option value="">Mecânico</option>';
      mecanicos.forEach(m => {
        mecanicoSelect.innerHTML += `<option value="${m._id}">${m.nome}</option>`;
      });
    }
  } catch (err) {
    console.error('Erro ao carregar selects:', err);
  }
}

// ── Listar Ordens ────────────────────────────────────────────
async function carregar() {
  if (!lista) return;
  try {
    const res = await fetch('/api/ordens-servico', { headers });
    if (!res.ok) return;
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
        <td><button onclick="excluirOrdem('${o._id}')">🗑️</button></td>
      `;
      lista.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao carregar ordens:', err);
  }
}

// ── Criar Ordem ──────────────────────────────────────────────
if (form) {
  form.onsubmit = async e => {
    e.preventDefault();
    const descricaoEl = document.getElementById('descricao');
    const valorEl     = document.getElementById('valor');

    await fetch('/api/ordens-servico', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cliente:   clienteSelect.value,
        mecanico:  mecanicoSelect.value,
        descricao: descricaoEl?.value,
        valor:     valorEl?.value
      })
    });

    form.reset();
    carregar();
    carregarDashboard();
  };
}

// ── Excluir Ordem ────────────────────────────────────────────
async function excluirOrdem(id) {
  if (!confirm('Excluir ordem?')) return;
  await fetch('/api/ordens-servico/' + id, { method: 'DELETE', headers });
  carregar();
  carregarDashboard();
}

// ── Excluir Produto ──────────────────────────────────────────
async function excluirProduto(id) {
  if (!confirm('Excluir esta peça?')) return;
  try {
    const res = await fetch('/api/produtos/' + id, { method: 'DELETE', headers });
    if (!res.ok) { alert('Erro ao excluir produto'); return; }
    carregarPecas?.();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir produto');
  }
}

// ── Editar Produto ───────────────────────────────────────────
async function editarProduto(id) {
  try {
    const res = await fetch('/api/produtos/' + id, { headers });
    const produto = await res.json();

    const nomeEl     = document.getElementById('nome');
    const tipoEl     = document.getElementById('tipo');
    const descEl     = document.getElementById('descricao');
    const precoEl    = document.getElementById('preco');
    const estoqueEl  = document.getElementById('estoque');
    const formProduto= document.getElementById('formProduto');

    if (nomeEl)    nomeEl.value    = produto.nome;
    if (tipoEl)    tipoEl.value    = produto.tipo || '';
    if (descEl)    descEl.value    = produto.descricao || '';
    if (precoEl)   precoEl.value   = produto.preco;
    if (estoqueEl) estoqueEl.value = produto.estoque;

    if (formProduto) formProduto.dataset.editando = id;

    abrirModalProduto?.();
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar produto');
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarDashboard();
  carregarSelects();
  carregar();
});
