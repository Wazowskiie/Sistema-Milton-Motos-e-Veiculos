document.getElementById('formProduto').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const tipo = document.getElementById('tipo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const preco = document.getElementById('preco').value.trim();
  const estoque = document.getElementById('estoque').value.trim();

  if (!nome || !tipo || !descricao || !preco || !estoque) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    const resposta = await fetch('http://localhost:5000/api/produtos/cadastro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome, tipo, descricao, preco, estoque }),
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
});
