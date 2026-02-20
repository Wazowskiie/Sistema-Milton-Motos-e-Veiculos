const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login-cadastro.html';
}


const lista = document.getElementById('lista');
const form = document.getElementById('formCliente');

async function carregar() {
  const res = await fetch('/api/clientes', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const dados = await res.json();
  lista.innerHTML = '';
  dados.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.nome}</td>
      <td>${c.telefone || '-'}</td>
      <td>${c.email || '-'}</td>
      <td>
        <button class="ghost" onclick="editar('${c._id}')">✏️</button>
        <button class="ghost danger" onclick="excluir('${c._id}')">🗑️</button>
      </td>
    `;
    lista.appendChild(tr);
  });
}

form.onsubmit = async e => {
  e.preventDefault();
  const body = {
    nome: nome.value,
    telefone: telefone.value,
    email: email.value,
    cpf: cpf.value
  };

  await fetch('/api/clientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(body)
  });

  form.reset();
  carregar();
};

async function excluir(id) {
  if (!confirm('Excluir cliente?')) return;
  await fetch('/api/clientes/' + id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
  carregar();
}

async function editar(id) {
  const nomeNovo = prompt('Novo nome:');
  if (!nomeNovo) return;
  await fetch('/api/clientes/' + id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ nome: nomeNovo })
  });
  carregar();
}

carregar();
