document.getElementById('formProduto').addEventListener('submit', async (e) => {
  e.preventDefault();

  const codigo = document.getElementById('codigo')?.value.trim();
  const nome = document.getElementById('nome').value.trim();
  const tipo = document.getElementById('tipo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const preco = Number(document.getElementById('preco').value);
  const estoque = Number(document.getElementById('estoque').value);


const token = localStorage.getItem('token');
  const id = form.dataset.editando;
  
  const url = id
    ? `/api/produtos/${id}`
    : `/api/produtos`;

    const method = id ? 'PUT' : 'POST';
const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ nome, tipo, descricao, preco, estoque })
  });

  if (!res.ok) {
    alert('Erro ao salvar produto');
    return;
  }

  alert(id ? 'Produto atualizado!' : 'Produto cadastrado!');

  form.reset();
  delete form.dataset.editando;
  fecharModalProduto();
  carregarPecas();
});



  if (!nome || !tipo || !descricao || isNaN(preco) || isNaN(estoque)) {
    alert('Preencha todos os campos corretamente!');
    return;
  }

  try {
    const resposta = await fetch('/api/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codigo,
        nome,
        tipo,
        descricao,
        preco,
        estoque
      }),
    });

    const data = await resposta.json();

    if (resposta.ok) {
      alert('Produto adicionado com sucesso!');
      location.reload();
    } else {
      alert(data.message || 'Erro ao adicionar produto.');
    }

  } catch (error) {
    console.error('Erro ao conectar com o servidor:', error);
    alert('Erro ao conectar com o servidor.');
  }
