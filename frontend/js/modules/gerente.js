export function init(api, user) {
  // Gestión de productos
  async function loadAdminProducts() {
    const grid = document.getElementById('adminProductGrid');
    if (!grid) return;
    try {
      const productos = await api.get('/productos');
      grid.innerHTML = productos.map(p => `
        <div class="product-card">
          <div class="product-emoji">${p.imagen_url || '📦'}</div>
          <div class="product-info">
            <h3>${p.nombre}</h3>
            <div class="admin-card-buttons">
              <button class="btn-admin-edit" data-id="${p.id}">Editar</button>
              <button class="btn-admin-delete" data-id="${p.id}">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error(e); }
  }
  document.getElementById('btnAddProduct')?.addEventListener('click', () => alert('Crear producto (pendiente formulario)'));
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#view-admin-products') loadAdminProducts();
  });
  if (window.location.hash === '#view-admin-products') loadAdminProducts();

  // Gestión de usuarios
  document.getElementById('btnAddUser')?.addEventListener('click', () => {
    document.getElementById('userFormContainer').style.display = 'block';
  });
  document.getElementById('btnCancelUser')?.addEventListener('click', () => {
    document.getElementById('userFormContainer').style.display = 'none';
  });
  document.getElementById('btnSaveUser')?.addEventListener('click', async () => {
    const data = {
      nombre: document.getElementById('userFormName').value,
      apellido: document.getElementById('userFormLastName').value,
      email: document.getElementById('userFormEmail').value,
      telefono: document.getElementById('userFormPhone').value,
      password: document.getElementById('userFormPassword').value,
      rol: document.getElementById('userFormRole').value,
    };
    try {
      await api.post('/gerente/usuarios', data);
      alert('Usuario creado correctamente');
      document.getElementById('userFormContainer').style.display = 'none';
      loadUsers();
    } catch (e) { alert(e.message); }
  });

  async function loadUsers() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;
    try {
      const usuarios = await api.get('/gerente/usuarios');
      container.innerHTML = `
        <table class="cart-table">
          <tr><th>Nombre</th><th>Email</th><th>Rol</th></tr>
          ${usuarios.map(u => `<tr><td>${u.nombre} ${u.apellido}</td><td>${u.email}</td><td>${u.rol}</td></tr>`).join('')}
        </table>`;
    } catch (e) { console.error(e); }
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#view-admin-users') loadUsers();
  });
  if (window.location.hash === '#view-admin-users') loadUsers();

  // Reportes
  async function loadReports() {
    const container = document.getElementById('reportesContainer');
    if (!container) return;
    try {
      const data = await api.get('/gerente/reportes/ventas');
      container.innerHTML = '<h3>Ventas últimos 30 días</h3>' +
        data.map(d => `<div>${d.fecha}: $${d.total_usd} / Bs.${d.total_bs}</div>`).join('');
    } catch (e) { container.innerHTML = 'Error al cargar reportes'; }
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#view-admin-reportes') loadReports();
  });
  if (window.location.hash === '#view-admin-reportes') loadReports();

  // Devoluciones (placeholder)
  const devolucionesContainer = document.getElementById('devolucionesContainer');
  if (devolucionesContainer) devolucionesContainer.innerHTML = '<p>No hay solicitudes de devolución.</p>';
}