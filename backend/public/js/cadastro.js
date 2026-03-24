window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastro');
  const msg  = document.getElementById('mensagem');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome  = document.getElementById('nome')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const senha = document.getElementById('senha')?.value.trim();

    try {
      const resposta = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        if (resultado.token)   localStorage.setItem('token', resultado.token);
        if (resultado.usuario) localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        window.location.href = 'dashboard.html';
      } else {
        if (msg) {
          msg.style.color = 'red';
          msg.textContent = resultado.erro || resultado.error || 'Erro no cadastro.';
        }
      }
    } catch (err) {
      console.error(err);
      if (msg) {
        msg.style.color = 'red';
        msg.textContent = 'Erro ao conectar com o servidor.';
      }
    }
  });
});
