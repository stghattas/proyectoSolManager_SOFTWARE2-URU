// dashboard.js
(async function() {
  // Verificar token
  const token = localStorage.getItem('token') || localStorage.getItem('sol_manager_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Decodificar payload (sin validar firma)
  function parseJwt(t) {
    try {
      const base64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (e) {
      return null;
    }
  }

  const payload = parseJwt(token);
  if (!payload || !payload.id || !payload.rol) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
    return;
  }

  const currentUser = {
    id: payload.id,
    nombre: payload.nombre || 'Usuario',
    rol: payload.rol
  };

  // Mostrar datos en sidebar
  document.getElementById('sidebarUserName').textContent = currentUser.nombre;
  document.getElementById('sidebarUserRole').textContent = `Rol: ${currentUser.rol}`;

  // Menú según roles
  const menuItems = {
    cliente: ['menu-home', 'menu-catalog', 'menu-cart', 'menu-orders', 'menu-delivery', 'menu-config'],
    cajero: ['menu-cashier-pos', 'menu-config'],
    almacenista: ['menu-home', 'menu-warehouse-movements', 'menu-warehouse-purchases', 'menu-warehouse-adjustments', 'menu-warehouse-alerts', 'menu-config'],
    repartidor: ['menu-delivery-list', 'menu-config'],
    gerente: ['menu-home', 'menu-admin-products', 'menu-admin-almacenes', 'menu-admin-proveedores', 'menu-admin-reportes', 'menu-admin-users', 'menu-admin-devoluciones', 'menu-config'],
    admin: [
      'menu-home', 'menu-catalog', 'menu-cart', 'menu-orders', 'menu-delivery',
      'menu-cashier-pos', 'menu-delivery-list', 'menu-admin-products', 'menu-admin-almacenes',
      'menu-admin-proveedores', 'menu-admin-reportes', 'menu-admin-users', 'menu-admin-devoluciones',
      'menu-warehouse-movements', 'menu-warehouse-purchases', 'menu-warehouse-adjustments',
      'menu-warehouse-alerts', 'menu-config'
    ]
  };

  // Ocultar todos los botones primero
  document.querySelectorAll('.menu-btn').forEach(btn => btn.style.display = 'none');

  // Mostrar solo los del rol
  const allowed = menuItems[currentUser.rol] || [];
  allowed.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = 'block';
  });

  // Navegación entre vistas
  const viewMap = {
    'menu-home': 'view-home',
    'menu-catalog': 'view-catalog',
    'menu-cart': 'view-cart',
    'menu-orders': 'view-orders',
    'menu-delivery': 'view-delivery',
    'menu-config': 'view-config',
    'menu-cashier-pos': 'view-cashier-pos',
    'menu-delivery-list': 'view-delivery-list',
    'menu-admin-products': 'view-admin-products',
    'menu-admin-almacenes': 'view-admin-almacenes',
    'menu-admin-proveedores': 'view-admin-proveedores',
    'menu-admin-reportes': 'view-admin-reportes',
    'menu-admin-users': 'view-admin-users',
    'menu-admin-devoluciones': 'view-admin-devoluciones',
    'menu-warehouse-movements': 'view-warehouse-movements',
    'menu-warehouse-purchases': 'view-warehouse-purchases',
    'menu-warehouse-adjustments': 'view-warehouse-adjustments',
    'menu-warehouse-alerts': 'view-warehouse-alerts'
  };

 function switchView(viewId) {
  document.querySelectorAll('.dashboard-view').forEach(v => v.style.display = 'none');
  const view = document.getElementById(viewId);
  if (view) view.style.display = 'block';

  // Mostrar/ocultar barra de búsqueda superior
  const searchGroup = document.getElementById('searchGroup');
  if (searchGroup) {
    searchGroup.style.display = (viewId === 'view-home') ? 'flex' : 'none';
  }

    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    for (const [btnId, vId] of Object.entries(viewMap)) {
      if (vId === viewId) {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('active');
      }
    }
    window.location.hash = viewId;
  }

  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const vId = viewMap[btn.id];
      if (vId) switchView(vId);
    });
  });

  // Botón volver
  document.getElementById('btnBack').addEventListener('click', () => switchView('view-home'));

  // Tema oscuro
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️ Modo claro';
  }
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
  });

  // Cerrar sesión
  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sol_manager_token');
    window.location.href = 'index.html';
  });

  // Cargar módulo del rol
  let modulePath;
  switch (currentUser.rol) {
    case 'cliente': modulePath = './modules/cliente.js'; break;
    case 'cajero': modulePath = './modules/cajero.js'; break;
    case 'almacenista': modulePath = './modules/almacenista.js'; break;
    case 'repartidor': modulePath = './modules/repartidor.js'; break;
    case 'gerente':
    case 'admin': modulePath = './modules/gerente.js'; break;
    default: modulePath = './modules/cliente.js';
  }

  try {
    // Cargar api.js como módulo (si no está ya como global)
    const api = window.api || (await import('./api.js')).default;
    const module = await import(modulePath);
    if (module.init) {
      module.init(api, currentUser);
    }
    // Navegar a la vista inicial (home)
    switchView('view-home');
  } catch (error) {
    console.error('Error al cargar módulo:', error);
    alert('Error al inicializar el módulo del cliente. Ver consola.');
  }
})();