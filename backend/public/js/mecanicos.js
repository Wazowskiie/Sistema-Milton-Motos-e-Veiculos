const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login-cadastro.html';
}

const lista = document.getElementById('lista');
const form = document.getElementById('formMecanico');

async function carregar() {
  const res = await fetch('/api/mecanicos', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const dados = await res.json();
  lista.innerHTML = '';
  dados.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.nome}</td>
      <td>${m.telefone || '-'}</td>
      <td>${m.especialidade || '-'}</td>
      <td>
        <button class="ghost" onclick="editar('${m._id}')">✏️</button>
        <button class="ghost danger" onclick="excluir('${m._id}')">🗑️</button>
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
    especialidade: especialidade.value
  };

  await fetch('/api/mecanicos', {
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
  if (!confirm('Excluir mecânico?')) return;
  await fetch('/api/mecanicos/' + id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
  carregar();
}

async function editar(id) {
  const nomeNovo = prompt('Novo nome:');
  if (!nomeNovo) return;
  await fetch('/api/mecanicos/' + id, {
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
