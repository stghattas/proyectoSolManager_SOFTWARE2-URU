
// Elementos DOM
const loginTab = document.getElementById('tabLogin');
const registerTab = document.getElementById('tabRegister');
const loginFormDiv = document.getElementById('loginForm');
const registerFormDiv = document.getElementById('registerForm');
const messageDiv = document.getElementById('messageArea');

// Inputs login
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const doLoginBtn = document.getElementById('doLogin');

// Inputs registro
const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const doRegisterBtn = document.getElementById('doRegister');

const forgotLink = document.getElementById('forgotLink');
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;

// Mostrar mensaje temporal
function showMessage(msg, isError = false) {
  messageDiv.textContent = msg;
  messageDiv.style.display = 'block';
  messageDiv.style.backgroundColor = isError ? '#fee2e2' : '#fef9c3';
  messageDiv.style.color = isError ? '#b91c1c' : '#854d0e';
  if (isError) {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 4000);
  } else {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
}

// Cambiar entre tabs
function setActiveTab(tab) {
  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginFormDiv.style.display = 'block';
    registerFormDiv.style.display = 'none';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginFormDiv.style.display = 'none';
    registerFormDiv.style.display = 'block';
  }
}

loginTab.addEventListener('click', () => setActiveTab('login'));
registerTab.addEventListener('click', () => setActiveTab('register'));

// LOGIC: Ingresar (simulación - demo)
doLoginBtn.addEventListener('click', () => {
  const email = loginEmail.value.trim();
  const pwd = loginPassword.value.trim();
  if (!email || !pwd) {
    showMessage('Por favor completa el correo y la contraseña.', true);
    return;
  }
  if (!email.includes('@')) {
    showMessage('El correo parece inválido.', true);
    return;
  }
  // Simulación de autenticación exitosa
  showMessage(`Bienvenido de nuevo, ${email}. Redirigiendo al panel...`, false);
  setTimeout(() => {
    // En una app real redirigir según rol. Demo: alerta y recarga simulada
    alert('Acceso simulado exitoso. En producción redirigiría al dashboard correspondiente (Cliente/Manager).');
    // Podrías limpiar o mantener
  }, 1500);
});

// Registro validación
doRegisterBtn.addEventListener('click', () => {
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const pwd = regPassword.value.trim();

  if (!name || !email || !pwd) {
    showMessage('Todos los campos son obligatorios.', true);
    return;
  }
  if (!email.includes('@')) {
    showMessage('Correo electrónico inválido.', true);
    return;
  }
  if (pwd.length < 6) {
    showMessage('La contraseña debe tener al menos 6 caracteres.', true);
    return;
  }

  // Simular registro exitoso
  showMessage(`¡Cuenta creada para ${name}! Ahora puedes iniciar sesión.`, false);

  // Limpiar campos y cambiar a login
  setTimeout(() => {
    setActiveTab('login');
    loginEmail.value = email;
    loginPassword.value = '';
    regName.value = '';
    regEmail.value = '';
    regPassword.value = '';
  }, 2000);
});

// Recuperar contraseña (demo)
forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  showMessage(' Se ha enviado un enlace de recuperación a tu correo (demo).', false);
});

// Modo oscuro/claro persistente
function applyTheme(theme) {
  if (theme === 'dark') {
    body.classList.add('dark');
    themeToggleBtn.innerHTML = 'Modo claro';
  } else {
    body.classList.remove('dark');
    themeToggleBtn.innerHTML = ' Modo oscuro';
  }
  localStorage.setItem('solAuthTheme', theme);
}

function toggleTheme() {
  const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(newTheme);
}

const savedTheme = localStorage.getItem('solAuthTheme') || 'light';
applyTheme(savedTheme);
themeToggleBtn.addEventListener('click', toggleTheme);
