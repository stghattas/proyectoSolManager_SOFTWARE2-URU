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

// --- JSON DE USUARIOS PRECONFIGURADOS ---
const userDatabase = [
  { "email": "admin@sol.com", "password": "123", "role": "admin", "name": "Administrador" },
  { "email": "cliente@sol.com", "password": "123", "role": "cliente", "name": "Juan García" }
];

// Mostrar mensaje temporal
function showMessage(msg, isError = false) {
  messageDiv.textContent = msg;
  messageDiv.style.display = 'block';
  messageDiv.style.backgroundColor = isError ? '#fee2e2' : '#fef9c3';
  messageDiv.style.color = isError ? '#b91c1c' : '#854d0e';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, isError ? 4000 : 3000);
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

// LÓGICA: Ingresar con redirección al Dashboard real
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

  // Buscar en la base de datos local / guardados en localStorage dinámicos
  const dynamicUsers = JSON.parse(localStorage.getItem('solRegisteredUsers')) || [];
  const allUsers = [...userDatabase, ...dynamicUsers];
  
  const userFound = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pwd);

  if (userFound) {
    // 1. Guardar la sesión activa del usuario
    localStorage.setItem('solUserSession', JSON.stringify(userFound));
    
    // 2. Mostrar feedback y redirigir al panel dashboard.html
    showMessage(`Bienvenido de nuevo, ${userFound.name}. Redirigiendo al panel...`, false);
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  } else {
    showMessage('Credenciales incorrectas. Prueba con admin@sol.com o cliente@sol.com (clave: 123).', true);
  }
});

// Registro validación persistente local
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

  // Guardar en el arreglo dinámico de localStorage
  const dynamicUsers = JSON.parse(localStorage.getItem('solRegisteredUsers')) || [];
  
  if ([...userDatabase, ...dynamicUsers].some(u => u.email.toLowerCase() === email.toLowerCase())) {
    showMessage('Este correo electrónico ya está registrado.', true);
    return;
  }

  const newUser = {
    name: name,
    email: email,
    password: pwd,
    role: "cliente" // Por defecto se registran como clientes
  };

  dynamicUsers.push(newUser);
  localStorage.setItem('solRegisteredUsers', JSON.stringify(dynamicUsers));

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
  showMessage('Se ha enviado un enlace de recuperación a tu correo (demo).', false);
});

// Modo oscuro/claro persistente
function applyTheme(theme) {
  if (theme === 'dark') {
    body.classList.add('dark');
    themeToggleBtn.innerHTML = 'Modo claro';
  } else {
    body.classList.remove('dark');
    themeToggleBtn.innerHTML = 'Modo oscuro';
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