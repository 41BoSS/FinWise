const API_URL = 'http://localhost:5000';

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
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nome: name,
      email,
      senha: password
    })
  })
<<<<<<< HEAD
  .then(res => {
    const isOk = res.ok;
    return res.json().then(data => ({ isOk, data }));
  })
  .then(({ isOk, data }) => {
    if (isOk) {
      window.location.href = 'login.html';
    } else {
      alert(data.message || 'Erro no registro.');
    }
  })
  .catch(err => alert('Erro de conexão'));
=======
    .then(res => {
      const isOk = res.ok;
      return res.json().then(data => ({ isOk, data }));
    })
    .then(({ isOk, data }) => {
      if (isOk) {
        window.location.href = 'login.html';
      } else {
        alert(data.message || 'Erro no registro.');
      }
    })
    .catch(() => {
      alert('Erro de conexão.');
    });
>>>>>>> 3712b2f6417744004533a766da84d48d31cc0511
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
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      senha: password
    })
  })
<<<<<<< HEAD
  .then(res => {
    const isOk = res.ok;
    return res.json().then(data => ({ isOk, data }));
  })
  .then(({ isOk, data }) => {
    if (isOk && data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || 'Erro no login.');
    }
  })
  .catch(err => alert('Erro de conexão'));
}

function handleLogout() {
  localStorage.removeItem('token');
<<<<<<< HEAD
=======

  // Corrigido
>>>>>>> 3712b2f6417744004533a766da84d48d31cc0511
  window.location.href = 'login.html';
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);

  if (input) {
    input.type = input.type === 'password'
      ? 'text'
      : 'password';
  }
}