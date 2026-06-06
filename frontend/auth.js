<<<<<<< HEAD
const API_URL = 'http://localhost:5000';
=======
const API_URL = 'http://127.0.0.1:5000';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirm_password').value.trim();
  const terms = document.getElementById('terms').checked;
  
  if (!name || !email || !password || !confirmPassword || !terms) {
    alert('Preencha todos os campos e aceite os termos.');
    return;
  }
  if (password !== confirmPassword) {
    alert('As senhas não conferem.');
    return;
  }
  
  fetch(`${API_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: name, email, senha: password })
  })
  .then(res => {
    const isOk = res.ok;
    return res.json().then(data => ({ isOk, data }));
  })
  .then(({ isOk, data }) => {
    if (isOk) {
<<<<<<< HEAD
      window.location.href = '/login.html';
=======
      window.location.href = 'login.html';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
    } else {
      alert(data.message || 'Erro no registro.');
    }
  })
  .catch(err => alert('Erro de conexão'));
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  
  if (!email || !password) {
    alert('Preencha email e senha.');
    return;
  }
  
  fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: password })
  })
  .then(res => {
    const isOk = res.ok;
    return res.json().then(data => ({ isOk, data }));
  })
  .then(({ isOk, data }) => {
    if (isOk && data.token) {
      localStorage.setItem('token', data.token);
<<<<<<< HEAD
      window.location.href = '/dashboard.html';
=======
      window.location.href = 'dashboard.html';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
    } else {
      alert(data.message || 'Erro no login.');
    }
  })
  .catch(err => alert('Erro de conexão'));
}

function handleLogout() {
  localStorage.removeItem('token');
<<<<<<< HEAD
  window.location.href = '/login.html';
=======
  window.location.href = 'login.html';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}