document.addEventListener('DOMContentLoaded', () => {
  // =====================
  // TEMA OSCURO / CLARO
  // =====================
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Aplicar tema guardado
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark');
    themeToggle.textContent = '☀️ Modo claro';
  }

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
  });

  // --- ELEMENTOS DEL DOM ---
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // Inputs de Login
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const btnLogin = document.getElementById('doLogin');

  // Inputs de Registro
  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const btnRegister = document.getElementById('doRegister');

  // Área de mensajes
  const messageArea = document.getElementById('messageArea');

  // --- LÓGICA DE PESTAÑAS ---
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    clearMessage();
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    clearMessage();
  });

  // --- FUNCIONES AUXILIARES PARA MENSAJES ---
  function showMessage(text, isError = true) {
    messageArea.textContent = text;
    messageArea.style.display = 'block';
    messageArea.style.color = isError ? '#ef4444' : '#10b981';
  }

  function clearMessage() {
    messageArea.textContent = '';
    messageArea.style.display = 'none';
  }

  // --- ACCIÓN: REGISTRAR USUARIO ---
  btnRegister.addEventListener('click', async () => {
    const nombre = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;

    if (!nombre || !email || !password) {
      return showMessage('Por favor, rellena todos los campos.');
    }

    try {
      clearMessage();
      const response = await window.api.post('/auth/register', {
        nombre,
        email,
        password,
        rol: 'cliente'
      });

      showMessage('¡Cuenta creada con éxito! Ya puedes iniciar sesión.', false);
      
      regName.value = '';
      regEmail.value = '';
      regPassword.value = '';
      
      setTimeout(() => tabLogin.click(), 2000);
    } catch (error) {
      showMessage(error.message);
    }
  });

  // --- ACCIÓN: INICIAR SESIÓN ---
  btnLogin.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      return showMessage('Por favor, ingresa tu correo y contraseña.');
    }

    try {
      clearMessage();
      const response = await window.api.post('/auth/login', { email, password });

      localStorage.setItem('token', response.token);
      localStorage.setItem('sol_manager_user', JSON.stringify(response.user));

      showMessage('Ingresando al sistema...', false);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      showMessage(error.message);
    }
  });
});