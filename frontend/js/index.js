document.addEventListener('DOMContentLoaded', () => {
  // =====================
  // TEMA OSCURO / CLARO
  // =====================
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark');
    if (themeToggle) themeToggle.textContent = '☀️ Modo claro';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDark = body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
    });
  }

  // --- ELEMENTOS DEL DOM ---
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const messageArea = document.getElementById('messageArea');

  // Inputs de Login
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const btnLogin = document.getElementById('doLogin');

  // Inputs de Registro
  const regName = document.getElementById('regName');
  const regLastName = document.getElementById('regLastName');
  const regCedula = document.getElementById('regCedula');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const btnRegister = document.getElementById('doRegister');

  // --- FUNCIÓN MEJORADA PARA MOSTRAR MENSAJES ---
  function showMessage(text, isError = true) {
    if (!messageArea) {
      console.error('Falta #messageArea en el HTML');
      alert(text);
      return;
    }
    messageArea.textContent = text;
    messageArea.style.display = 'block';
    messageArea.style.color = isError ? '#991b1b' : '#065f46';       // texto rojo oscuro / verde oscuro
    messageArea.style.backgroundColor = isError ? '#fee2e2' : '#d1fae5'; // fondo rojo claro / verde claro
  }

  function clearMessage() {
    if (messageArea) {
      messageArea.textContent = '';
      messageArea.style.display = 'none';
    }
  }

  // --- LÓGICA DE PESTAÑAS ---
  if (tabLogin && tabRegister && loginForm && registerForm) {
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
  }

  // --- ACCIÓN: INICIAR SESIÓN ---
  if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
      const email = loginEmail?.value.trim() || '';
      const password = loginPassword?.value || '';

      if (!email || !password) {
        return showMessage('Por favor, ingresa tu correo y contraseña.', true);
      }

      try {
        clearMessage();
        const response = await window.api.post('/auth/login', { email, password });

        sessionStorage.setItem('sol_manager_token', response.token);
        sessionStorage.setItem('sol_manager_user', JSON.stringify(response.user));

        showMessage('Ingresando al sistema...', false);

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } catch (error) {
        showMessage(error.message || 'Error al iniciar sesión', true);
      }
    });
  }

  // --- ACCIÓN: REGISTRAR USUARIO ---
  if (btnRegister) {
    btnRegister.addEventListener('click', async () => {
      const nombre = regName?.value.trim() || '';
      const apellido = regLastName?.value.trim() || '';
      const cedula = regCedula?.value.trim() || '';
      const email = regEmail?.value.trim() || '';
      const password = regPassword?.value || '';

      if (!nombre || !apellido || !email || !password) {
        return showMessage('Por favor, rellena todos los campos obligatorios', true);
      }

      try {
        clearMessage();
        await window.api.post('/auth/register', {
          nombre,
          apellido,
          cedula: cedula || null,
          email,
          password,
          rol: 'cliente'
        });

        showMessage('¡Cuenta creada con éxito! Ya puedes iniciar sesión.', false);

        // Limpiar campos
        if (regName) regName.value = '';
        if (regLastName) regLastName.value = '';
        if (regCedula) regCedula.value = '';
        if (regEmail) regEmail.value = '';
        if (regPassword) regPassword.value = '';

        setTimeout(() => tabLogin?.click(), 2000);
      } catch (error) {
        showMessage(error.message || 'Error al registrarse', true);
      }
    });
  }
});