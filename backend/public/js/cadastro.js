window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastro');
  const msg = document.getElementById('mensagem');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    try {
      const resposta = await fetch('/api/usuarios/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        localStorage.setItem('usuario', JSON.stringify({ nome, email })); 
        window.location.href = 'dashboard.html';
      } else {
        msg.style.color = 'red';
        msg.textContent = resultado.message || resultado.error || 'Erro no cadastro.';
      }
    } catch (err) {
      console.error(err);
      msg.style.color = 'red';
      msg.textContent = 'Erro ao conectar com o servidor.';
    }
  });
});
<script src="js/cadastro.js"></script>
