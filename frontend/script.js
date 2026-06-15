document.addEventListener('DOMContentLoaded', () => {
  console.log('Script carregado');
  const API_URL = 'http://localhost:5000';

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name')?.value;
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      const confirmPassword = document.getElementById('confirm_password')?.value;
      const terms = document.getElementById('terms')?.checked;
      if (!name || !email || !password || !confirmPassword || !terms) {
        alert('Preencha todos os campos e aceite os termos.');
        return;
      }
      if (password !== confirmPassword) {
        alert('As senhas não conferem.');
        return;
      }
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: name, email, senha: password })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Registro realizado com sucesso!');
        } else {
          alert(data.error || 'Erro no registro.');
        }
      } catch (error) {
        alert('Erro de conexão.');
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      if (!email || !password) {
        alert('Preencha email e senha.');
        return;
      }
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha: password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          alert('Login realizado!');
          window.location.href = '/';
        } else {
          alert(data.error || 'Erro no login.');
        }
      } catch (error) {
        alert('Erro de conexão.');
      }
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
  }
});