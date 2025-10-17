document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const mensagem = document.getElementById('mensagem');

  try {
    const resposta = await fetch('http://localhost:5000/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      window.location.href = 'dashboard.html'; // redireciona após login
    } else {
      mensagem.textContent = data.error || 'Erro ao fazer login';
    }
  } catch (err) {
    mensagem.textContent = 'Erro ao conectar com o servidor.';
  }
});
