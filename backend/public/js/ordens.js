const token = localStorage.getItem('token');
if (!token) window.location.href = '/login-cadastro.html';

const headers = {
  Authorization: 'Bearer ' + token,
  'Content-Type': 'application/json'
};

const lista         = document.getElementById('lista');
const clienteSelect = document.getElementById('cliente');
const mecanicoSelect= document.getElementById('mecanico');
const form          = document.getElementById('formOrdem');

async function carregarSelects() {
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

async function carregar() {
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
        <td><button onclick="excluir('${o._id}')">🗑️</button></td>
      `;
      lista.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao carregar ordens:', err);
  }
}

if (form) {
  form.onsubmit = async e => {
    e.preventDefault();
    const descricao = document.getElementById('descricao');
    const valor     = document.getElementById('valor');

    await fetch('/api/ordens-servico', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cliente:   clienteSelect.value,
        mecanico:  mecanicoSelect.value,
        descricao: descricao?.value,
        valor:     valor?.value
      })
    });

    form.reset();
    carregar();
  };
}

async function excluir(id) {
  if (!confirm('Excluir ordem?')) return;
  await fetch('/api/ordens-servico/' + id, { method: 'DELETE', headers });
  carregar();
}

carregarSelects();
carregar();
