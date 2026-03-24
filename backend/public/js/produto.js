const token = localStorage.getItem('token');
if (!token) location.href = 'login-cadastro.html';

const headers = {
  Authorization: 'Bearer ' + token,
  'Content-Type': 'application/json'
};

const form = document.getElementById('formProduto');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const codigo   = document.getElementById('codigo')?.value.trim();
    const nome     = document.getElementById('nome')?.value.trim();
    const tipo     = document.getElementById('tipo')?.value.trim();
    const descricao= document.getElementById('descricao')?.value.trim();
    const preco    = Number(document.getElementById('preco')?.value);
    const estoque  = Number(document.getElementById('estoque')?.value);

    if (!nome || !tipo || isNaN(preco) || isNaN(estoque)) {
      alert('Preencha todos os campos corretamente!');
      return;
    }

    const id     = form.dataset.editando;
    const url    = id ? `/api/produtos/${id}` : '/api/produtos';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ codigo, nome, tipo, descricao, preco, estoque })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.erro || 'Erro ao salvar produto');
        return;
      }

      alert(id ? 'Produto atualizado!' : 'Produto cadastrado!');
      form.reset();
      delete form.dataset.editando;

      if (typeof fecharModalProduto === 'function') fecharModalProduto();
      if (typeof carregarPecas     === 'function') carregarPecas();

    } catch (error) {
      console.error('Erro ao conectar com o servidor:', error);
      alert('Erro ao conectar com o servidor.');
    }
  });
}
