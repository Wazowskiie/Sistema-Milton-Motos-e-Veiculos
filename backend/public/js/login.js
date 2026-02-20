

// ===== CONFIG PRODUÇÃO (SEM LOCALHOST) =====
const API_LOGIN = '/api/auth/login';
const API_CADASTRO = '/api/auth/cadastro';
const DASHBOARD_URL = 'dashboard.html';

// ===== TABS =====
const tabLogin = document.getElementById('tabLogin');
const tabCadastro = document.getElementById('tabCadastro');
const viewLogin = document.getElementById('viewLogin');
const viewCadastro = document.getElementById('viewCadastro');

tabLogin.onclick = () => toggleTab(true);
tabCadastro.onclick = () => toggleTab(false);

function toggleTab(isLogin) {
  tabLogin.classList.toggle('active', isLogin);
  tabCadastro.classList.toggle('active', !isLogin);
  viewLogin.style.display = isLogin ? '' : 'none';
  viewCadastro.style.display = isLogin ? 'none' : '';
}

// LOGIN
const formLogin = document.getElementById('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailLogin').value.trim();
    const senha = document.getElementById('senhaLogin').value.trim();

    if (!email || !senha) {
      alert('Preencha email e senha');
      return;
    }

    try {
      const res = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.erro || 'Erro no login');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      window.location.href = DASHBOARD_URL;

    } catch (err) {
      alert(err.message);
    }
  });
}

// CADASTRO
const formCadastro = document.getElementById('formCadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('emailCadastro').value.trim();
    const senha = document.getElementById('senhaCadastro').value.trim();

    if (!nome || !email || !senha) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch(API_CADASTRO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.erro || 'Erro no cadastro');
      }

      alert('Cadastro realizado com sucesso! Faça login.');
      location.reload();

    } catch (err) {
      alert(err.message);
    }
  });
}
