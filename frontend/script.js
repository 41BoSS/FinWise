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
<<<<<<< HEAD
          localStorage.setItem('token', data.token);
          alert('Login realizado!');
          window.location.href = '/';
        } else {
          alert(data.error || 'Erro no login.');
=======
        localStorage.setItem('token', data.token);
        alert('Login realizado!');
        window.location.href = '/frontend/dashboard.html';
        } else {
        alert(data.error || 'Erro no login.');
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
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
<<<<<<< HEAD
      window.location.href = '/login';
=======
      window.location.href = '/frontend/login.html';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
    });
  }
});