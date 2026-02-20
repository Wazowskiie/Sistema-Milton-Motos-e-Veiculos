const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login-cadastro.html';
} '';


const lista = document.getElementById('lista');
const clienteSelect = document.getElementById('cliente');
const mecanicoSelect = document.getElementById('mecanico');
const form = document.getElementById('formOrdem');

async function carregarSelects() {
  const [clientes, mecanicos] = await Promise.all([
    fetch('/api/clientes', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json()),
    fetch('/api/mecanicos', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json())
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
};

async function excluir(id) {
  if (!confirm('Excluir ordem?')) return;
  await fetch('/api/ordens-servico/' + id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
  carregar();
}

carregarSelects();
carregar();
