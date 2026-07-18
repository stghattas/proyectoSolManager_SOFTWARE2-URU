// dashboard.js
(async function () {
  // ========== VERIFICAR TOKEN ==========
  const token = sessionStorage.getItem('token') || sessionStorage.getItem('sol_manager_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

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

  // ========== VERIFICAR ROL DE LA RUTA ==========
  const allowedRoles = ['repartidor', 'admin'];
  if (!allowedRoles.includes(currentUser.rol)) {
    alert('Acceso denegado. No tienes permisos para ver esta pantalla.');
    const rolePages = {
      gerente: 'gerente.html',
      cajero: 'pos.html',
      almacenista: 'almacen.html',
      repartidor: 'repartidor.html',
      cliente: 'cliente.html',
      admin: 'dashboard.html'
    };
    window.location.href = rolePages[currentUser.rol] || 'index.html';
    return;
  }

  document.getElementById('sidebarUserName').textContent = currentUser.nombre;
  document.getElementById('sidebarUserRole').textContent = `Rol: ${currentUser.rol}`;

  // ========== MENÚ SEGÚN ROL ==========
  const menuItems = {
   cliente: [
  'menu-home', 'menu-catalog', 'menu-cart', 'menu-orders', 'menu-delivery', 'menu-config', 'menu-returns'
],
   cajero: ['menu-cashier-pos', 'menu-cashier-clients', 'menu-config'],

    almacenista: [
      'menu-warehouse-movements', 'menu-warehouse-purchases', 'menu-warehouse-adjustments',
      'menu-warehouse-alerts', 'menu-home', 'menu-config'
    ],
    repartidor: [
      'menu-delivery-list', 'menu-config'
    ],
    gerente: [
  'menu-admin-reportes', 'menu-admin-users', 'menu-admin-products',
  'menu-admin-almacenes', 'menu-admin-proveedores', 'menu-admin-devoluciones',
  'menu-config'   
],
    admin: [
      'menu-home', 'menu-catalog', 'menu-cart', 'menu-orders', 'menu-delivery',
      'menu-cashier-pos', 'menu-delivery-list',
      'menu-admin-products', 'menu-admin-almacenes', 'menu-admin-proveedores',
      'menu-admin-reportes', 'menu-admin-users', 'menu-admin-devoluciones',
      'menu-warehouse-movements', 'menu-warehouse-purchases', 'menu-warehouse-adjustments',
      'menu-warehouse-alerts', 'menu-config'
    ]
  };

  // Ocultar todos y mostrar solo los del rol
  document.querySelectorAll('.menu-btn').forEach(btn => (btn.style.display = 'none'));
  const allowed = menuItems[currentUser.rol] || [];
  allowed.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = 'block';
  });

  // ***** NUEVO: Mover Configuración al final del menú *****
  const sidebarMenu = document.querySelector('.sidebar-menu');
  const configBtn = document.getElementById('menu-config');
  if (sidebarMenu && configBtn && allowed.includes('menu-config')) {
    const existingHr = configBtn.previousElementSibling;
    if (existingHr && existingHr.tagName === 'HR') {
      existingHr.remove();
    }
    sidebarMenu.appendChild(configBtn);
  }
  // ******************************************************

  // ========== MAPEO DE VISTAS ==========
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
    'menu-warehouse-alerts': 'view-warehouse-alerts',
    'menu-cashier-clients': 'view-cashier-clients',
    'menu-returns': 'view-returns',
  };

  function switchView(viewId) {
    document.querySelectorAll('.dashboard-view').forEach(v => (v.style.display = 'none'));
    const view = document.getElementById(viewId);
    if (view) view.style.display = 'block';

    const searchGroup = document.getElementById('searchGroup');
    if (searchGroup) {
      searchGroup.style.display = viewId === 'view-home' ? 'flex' : 'none';
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

  document.getElementById('btnBack').addEventListener('click', () => switchView('view-home'));

  // ========== TEMA OSCURO ==========
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

  // ========== CERRAR SESIÓN ==========
  document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('sol_manager_token');
    sessionStorage.removeItem('sol_manager_user');
    window.location.href = 'index.html';
  });

  let api = window.api;
  if (!api) {
    try {
      const apiModule = await import('./api.js');
      api = apiModule.default;
    } catch (e) {
      console.error('No se pudo cargar api.js', e);
      alert('Error al cargar la conexión con el servidor');
      return;
    }
  }

  // ========== INICIALIZAR WEBSOCKET ==========
  try {
    const wsModule = await import('./wsClient.js');
    const wsClient = wsModule.default;
    wsClient.connect(token);
    window.wsClient = wsClient;
  } catch (error) {
    console.error('Error al inicializar el WebSocket:', error);
  }

  const roleModules = {
    cliente: './modules/cliente.js',
    cajero: './modules/cajero.js',
    almacenista: './modules/almacenista.js',
    repartidor: './modules/repartidor.js',
    gerente: './modules/gerente.js',
    admin: './modules/gerente.js'
  };

  const modulePath = roleModules[currentUser.rol] || './modules/cliente.js';

  try {
    const module = await import(modulePath);
    if (module.init) {
      module.init(api, currentUser);
    }
  } catch (error) {
    console.error(`Error al cargar módulo ${currentUser.rol}:`, error);
    alert('Error al inicializar el módulo del usuario.');
    return;
  }

  // ========== REDIRIGIR A LA VISTA PRINCIPAL DEL ROL ==========
  const defaultViewMap = {
    cliente: 'view-home',
    cajero: 'view-cashier-pos',
    almacenista: 'view-warehouse-movements',
    repartidor: 'view-delivery-list',
    gerente: 'view-admin-reportes',
    admin: 'view-admin-reportes'
  };

  const initialHash = window.location.hash.substring(1);
  if (initialHash && document.getElementById(initialHash)) {
    switchView(initialHash);
  } else {
    const defaultView = defaultViewMap[currentUser.rol] || 'view-home';
    switchView(defaultView);
  }
})();