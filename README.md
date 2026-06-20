# proyectoSolManager_SOFTWARE2-URU
// js/index.js
import { handleLogin, handleRegister } from './modules/auth.js';

// Elementos del DOM
const loginTab = document.getElementById('tabLogin');
const registerTab = document.getElementById('tabRegister');
const loginFormDiv = document.getElementById('loginForm');
const registerFormDiv = document.getElementById('registerForm');
const messageDiv = document.getElementById('messageArea');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const doLoginBtn = document.getElementById('doLogin');
const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regRole = document.getElementById('regRole');
const doRegisterBtn = document.getElementById('doRegister');
const forgotLink = document.getElementById('forgotLink');
const themeToggle = document.getElementById('themeToggle');

// ===== PESTAÑAS =====
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

// ===== MENSAJES =====
function showMessage(msg, isError = false) {
  messageDiv.textContent = msg;
  messageDiv.style.display = 'block';
  messageDiv.style.backgroundColor = isError ? '#fee2e2' : '#fef9c3';
  messageDiv.style.color = isError ? '#b91c1c' : '#854d0e';
  setTimeout(() => { messageDiv.style.display = 'none'; }, 4000);
}

// ===== LOGIN =====
doLoginBtn.addEventListener('click', async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!email || !password) {
    showMessage('Por favor completa todos los campos', true);
    return;
  }
  const result = await handleLogin(email, password);
  if (result.success) {
    showMessage(`Bienvenido ${result.user.name}, redirigiendo...`, false);
    setTimeout(() => window.location.href = '/pages/dashboard.html', 1200);
  } else {
    showMessage(result.error, true);
  }
});

// ===== REGISTRO =====
doRegisterBtn.addEventListener('click', async () => {
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value.trim();
  const role = regRole.value || 'cliente';
  if (!name || !email || !password) {
    showMessage('Todos los campos son obligatorios', true);
    return;
  }
  if (password.length < 6) {
    showMessage('La contraseña debe tener al menos 6 caracteres', true);
    return;
  }
  const result = await handleRegister({ name, email, password, role });
  if (result.success) {
    showMessage(`¡Cuenta creada! Redirigiendo...`, false);
    setTimeout(() => window.location.href = '/pages/dashboard.html', 1200);
  } else {
    showMessage(result.error, true);
  }
});

// ===== RECUPERAR CONTRASEÑA (demo) =====
forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  showMessage('Se ha enviado un enlace de recuperación a tu correo (demo)', false);
});

// ===== TEMA OSCURO/CLARO =====
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️ Modo claro';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙 Modo oscuro';
  }
  localStorage.setItem('solAuthTheme', theme);
}
const savedTheme = localStorage.getItem('solAuthTheme') || 'light';
applyTheme(savedTheme);
themeToggle.addEventListener('click', () => {
  const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(newTheme);
});

## Pruebas unitarias (Vitest)

Se añadieron pruebas unitarias para el controlador de autenticación.

- Archivo de tests: [backend/src/controllers/authController.spec.js](backend/src/controllers/authController.spec.js#L1-L999)

Pruebas incluidas (8 casos):

1. Login - Validación de entrada: retorna `400` si falta email o contraseña.
2. Login - Usuario inexistente: retorna `401` cuando el correo no existe.
3. Login - Contraseña incorrecta: retorna `401` si la contraseña no coincide.
4. Login - Éxito: retorna `accessToken` y datos del usuario.
5. Register - Validación de entrada: retorna `400` si faltan campos obligatorios.
6. Register - Rol inválido: retorna `400` para roles no permitidos.
7. Register - Correo duplicado: retorna `409` si el correo ya está registrado.
8. Register - Éxito: crea usuario y retorna `accessToken` y datos del usuario.

Cómo ejecutar las pruebas:

```bash
cd backend
npm install
npm test
```

Notas:

- Las pruebas usan `vitest` y mockean las dependencias (`../models/userModel` y `jsonwebtoken`) para aislar la lógica del controlador.
- El script `test` se agregó en `backend/package.json`.
