// gerente.js – Módulo completo para el rol Gerente
export function init(api, user) {

  // ========== FUNCIÓN AUXILIAR: MODAL GENÉRICO ==========
  function showModal(title, contentHtml, onSave) {
    let modal = document.getElementById('genericModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'genericModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <span class="close-modal" id="closeGenericModal">&times;</span>
          <h2 id="genericModalTitle"></h2>
          <div id="genericModalContent"></div>
          <button id="genericModalSave" class="btn-checkout">Guardar</button>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('closeGenericModal').addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    modal.style.display = 'flex';
    document.getElementById('genericModalTitle').textContent = title;
    document.getElementById('genericModalContent').innerHTML = contentHtml;
    document.getElementById('genericModalSave').onclick = async () => {
      await onSave();
    };
  }

  // ========== PRODUCTOS ==========
  async function loadAdminProducts() {
    const grid = document.getElementById('adminProductGrid');
    if (!grid) return;
    try {
      const productos = await api.get('/gerente/productos');
      grid.innerHTML = productos.map(p => `
        <div class="product-card">
          <div class="product-emoji">${p.imagen_url || '📦'}</div>
          <div class="product-info">
            <h3>${p.nombre}</h3>
            <p>$${parseFloat(p.precio_usd).toFixed(2)} / Bs.${parseFloat(p.precio_bs).toFixed(2)}</p>
            <div class="admin-card-buttons">
              <button class="btn-admin-edit" data-id="${p.id}">Editar</button>
              <button class="btn-admin-delete" data-id="${p.id}">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.btn-admin-edit').forEach(btn => {
        btn.addEventListener('click', () => openProductForm(productos.find(p => p.id === btn.dataset.id)));
      });
      grid.querySelectorAll('.btn-admin-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('¿Deshabilitar este producto?')) {
            await api.delete(`/gerente/productos/${btn.dataset.id}`);
            loadAdminProducts();
          }
        });
      });
    } catch (e) { console.error(e); }
  }

  async function openProductForm(producto = null) {
    const [unidades, categorias] = await Promise.all([
      api.get('/productos/unidades'),
      api.get('/productos/categorias')
    ]);

    const contentHtml = `
      <div class="form-group"><label>Nombre</label><input id="prodName" class="search-input" value="${producto?.nombre || ''}"></div>
      <div class="form-group"><label>Precio USD</label><input type="number" id="prodPrecioUSD" step="0.01" value="${producto?.precio_usd || ''}"></div>
      <div class="form-group"><label>Precio Bs</label><input type="number" id="prodPrecioBS" step="0.01" value="${producto?.precio_bs || ''}"></div>
      <div class="form-group"><label>Unidad</label>
        <select id="prodUnidad" class="search-input">${unidades.map(u => `<option value="${u.id}" ${producto?.unidad_medida_base_id === u.id ? 'selected' : ''}>${u.nombre}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Categoría</label>
        <select id="prodCategoria" class="search-input">${categorias.map(c => `<option value="${c.id}" ${producto?.categoria_id === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Imagen (emoji o URL)</label><input id="prodImagen" class="search-input" value="${producto?.imagen_url || ''}"></div>
    `;

    showModal(producto ? 'Editar Producto' : 'Nuevo Producto', contentHtml, async () => {
      const data = {
        nombre: document.getElementById('prodName').value,
        precio_usd: parseFloat(document.getElementById('prodPrecioUSD').value),
        precio_bs: parseFloat(document.getElementById('prodPrecioBS').value),
        unidad_medida_base_id: document.getElementById('prodUnidad').value,
        categoria_id: document.getElementById('prodCategoria').value,
        imagen_url: document.getElementById('prodImagen').value
      };
      if (producto) {
        await api.put(`/gerente/productos/${producto.id}`, data);
      } else {
        await api.post('/gerente/productos', data);
      }
      document.getElementById('genericModal').style.display = 'none';
      loadAdminProducts();
    });
  }

  document.getElementById('btnAddProduct')?.addEventListener('click', () => openProductForm());

  // ========== USUARIOS (con restricción de rol admin) ==========
  async function loadUsers() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;
    try {
      const usuarios = await api.get('/gerente/usuarios');
      container.innerHTML = `
        <table class="cart-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th>Acciones</th></tr></thead>
          <tbody>
            ${usuarios.map(u => `
              <tr>
                <td>${u.nombre} ${u.apellido}</td>
                <td>${u.email || '-'}</td>
                <td>${u.rol}</td>
                <td>${u.activo ? 'Sí' : 'No'}</td>
                <td>
                  <button class="btn-edit-user" data-id="${u.id}">Editar</button>
                  <button class="btn-toggle-user" data-id="${u.id}" data-activo="${u.activo}">${u.activo ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;

      container.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', () => openUserForm(usuarios.find(u => u.id === btn.dataset.id)));
      });

      container.querySelectorAll('.btn-toggle-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const activo = btn.dataset.activo === 'true';
          await api.put(`/gerente/usuarios/${id}`, { activo: !activo });
          loadUsers();
        });
      });
    } catch (e) { console.error(e); }
  }

  function openUserForm(user = null) {
    const formContainer = document.getElementById('userFormContainer');
    const title = document.getElementById('userFormTitle');
    const roleSelect = document.getElementById('userFormRole');

    // Eliminar opción "admin" para el gerente
    if (roleSelect) {
      const adminOption = roleSelect.querySelector('option[value="admin"]');
      if (adminOption) adminOption.remove();
    }

    formContainer.style.display = 'block';
    if (user) {
      title.textContent = 'Editar usuario';
      document.getElementById('userFormName').value = user.nombre || '';
      document.getElementById('userFormLastName').value = user.apellido || '';
      document.getElementById('userFormEmail').value = user.email || '';
      document.getElementById('userFormPhone').value = user.telefono || '';
      if (roleSelect) roleSelect.value = user.rol;
      document.getElementById('userFormPassword').style.display = 'none';
      formContainer.dataset.userId = user.id;
    } else {
      title.textContent = 'Nuevo usuario';
      document.getElementById('userFormName').value = '';
      document.getElementById('userFormLastName').value = '';
      document.getElementById('userFormEmail').value = '';
      document.getElementById('userFormPhone').value = '';
      if (roleSelect) roleSelect.value = 'cliente';
      document.getElementById('userFormPassword').style.display = 'block';
      delete formContainer.dataset.userId;
    }
  }

  document.getElementById('btnAddUser')?.addEventListener('click', () => openUserForm());
  document.getElementById('btnCancelUser')?.addEventListener('click', () => {
    document.getElementById('userFormContainer').style.display = 'none';
  });

  document.getElementById('btnSaveUser')?.addEventListener('click', async () => {
    const formContainer = document.getElementById('userFormContainer');
    const id = formContainer.dataset.userId;
    const data = {
      nombre: document.getElementById('userFormName').value,
      apellido: document.getElementById('userFormLastName').value,
      email: document.getElementById('userFormEmail').value,
      telefono: document.getElementById('userFormPhone').value,
      rol: document.getElementById('userFormRole').value
    };

    if (id) {
      await api.put(`/gerente/usuarios/${id}`, data);
    } else {
      const password = document.getElementById('userFormPassword').value;
      if (!password) return alert('La contraseña es obligatoria');
      await api.post('/gerente/usuarios', { ...data, password });
    }
    document.getElementById('userFormContainer').style.display = 'none';
    loadUsers();
  });

  // ========== ALMACENES ==========
  function openAlmacenForm(almacen = null) {
    const contentHtml = `
      <div class="form-group"><label>Nombre</label><input id="almNombre" class="search-input" value="${almacen?.nombre || ''}"></div>
      <div class="form-group"><label>Dirección</label><input id="almDireccion" class="search-input" value="${almacen?.direccion || ''}"></div>
    `;
    showModal(almacen ? 'Editar Almacén' : 'Nuevo Almacén', contentHtml, async () => {
      const data = {
        nombre: document.getElementById('almNombre').value,
        direccion: document.getElementById('almDireccion').value,
        activo: true
      };
      if (almacen) {
        await api.put(`/gerente/almacenes/${almacen.id}`, data);
      } else {
        await api.post('/gerente/almacenes', data);
      }
      document.getElementById('genericModal').style.display = 'none';
      loadAlmacenes();
    });
  }

  async function loadAlmacenes() {
    const container = document.getElementById('adminAlmacenList');
    if (!container) return;
    try {
      const almacenes = await api.get('/gerente/almacenes');
      container.innerHTML = almacenes.map(a => `
        <div class="order-card">
          <strong>${a.nombre}</strong> - ${a.direccion || ''} (${a.activo ? 'Activo' : 'Inactivo'})
          <button class="btn-edit-almacen" data-id="${a.id}">Editar</button>
        </div>
      `).join('');

      container.querySelectorAll('.btn-edit-almacen').forEach(btn => {
        btn.addEventListener('click', () => {
          const almacen = almacenes.find(a => a.id === btn.dataset.id);
          openAlmacenForm(almacen);
        });
      });
    } catch (e) { console.error(e); }
  }

  document.getElementById('btnAddAlmacen')?.addEventListener('click', () => openAlmacenForm());

  // ========== PROVEEDORES ==========
  function openProveedorForm(prov = null) {
    const contentHtml = `
      <div class="form-group"><label>Nombre</label><input id="provNombre" class="search-input" value="${prov?.nombre || ''}"></div>
      <div class="form-group"><label>Contacto</label><input id="provContacto" class="search-input" value="${prov?.contacto || ''}"></div>
      <div class="form-group"><label>Teléfono</label><input id="provTelefono" class="search-input" value="${prov?.telefono || ''}"></div>
      <div class="form-group"><label>Email</label><input id="provEmail" class="search-input" value="${prov?.email || ''}"></div>
      <div class="form-group"><label>Dirección</label><input id="provDireccion" class="search-input" value="${prov?.direccion || ''}"></div>
    `;
    showModal(prov ? 'Editar Proveedor' : 'Nuevo Proveedor', contentHtml, async () => {
      const data = {
        nombre: document.getElementById('provNombre').value,
        contacto: document.getElementById('provContacto').value,
        telefono: document.getElementById('provTelefono').value,
        email: document.getElementById('provEmail').value,
        direccion: document.getElementById('provDireccion').value,
        activo: true
      };
      if (prov) {
        await api.put(`/gerente/proveedores/${prov.id}`, data);
      } else {
        await api.post('/gerente/proveedores', data);
      }
      document.getElementById('genericModal').style.display = 'none';
      loadProveedores();
    });
  }

  async function loadProveedores() {
    const container = document.getElementById('adminProveedorList');
    if (!container) return;
    try {
      const proveedores = await api.get('/gerente/proveedores');
      container.innerHTML = proveedores.map(p => `
        <div class="order-card">
          <strong>${p.nombre}</strong> - ${p.contacto || 'Sin contacto'}
          <button class="btn-edit-proveedor" data-id="${p.id}">Editar</button>
        </div>
      `).join('');

      container.querySelectorAll('.btn-edit-proveedor').forEach(btn => {
        btn.addEventListener('click', () => {
          const prov = proveedores.find(p => p.id === btn.dataset.id);
          openProveedorForm(prov);
        });
      });
    } catch (e) { console.error(e); }
  }

  document.getElementById('btnAddProveedor')?.addEventListener('click', () => openProveedorForm());

  // ========== DEVOLUCIONES ==========
  async function loadDevoluciones() {
    const container = document.getElementById('devolucionesContainer');
    if (!container) return;
    try {
      const devoluciones = await api.get('/gerente/devoluciones');
      container.innerHTML = devoluciones.length === 0
        ? '<p>No hay solicitudes de devolución.</p>'
        : devoluciones.map(d => `
          <div class="order-card">
            <div><strong>Pedido:</strong> ${d.pedido_id?.substring(0,8)}</div>
            <div><strong>Cliente:</strong> ${d.cliente_nombre}</div>
            <div><strong>Motivo:</strong> ${d.motivo}</div>
            <div><strong>Estado:</strong> ${d.estado}</div>
            <div><strong>Productos:</strong> ${d.items?.map(i => `${i.producto_nombre} x${i.cantidad}`).join(', ') || 'N/A'}</div>
            ${d.estado === 'pendiente' ? `
              <button class="btn-approve" data-id="${d.id}">Aprobar</button>
              <button class="btn-reject" data-id="${d.id}">Rechazar</button>
            ` : ''}
          </div>
        `).join('');

      container.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async () => {
          const comentario = prompt('Comentario (opcional):');
          await api.post(`/gerente/devoluciones/${btn.dataset.id}/resolver`, { accion: 'aprobar', comentario });
          loadDevoluciones();
        });
      });
      container.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async () => {
          const comentario = prompt('Motivo de rechazo:');
          await api.post(`/gerente/devoluciones/${btn.dataset.id}/resolver`, { accion: 'rechazar', comentario });
          loadDevoluciones();
        });
      });
    } catch (e) {
      console.error(e);
      container.innerHTML = '<p>Error al cargar devoluciones.</p>';
    }
  }

  // ========== REPORTES (con Chart.js) ==========
  async function loadReports() {
    const container = document.getElementById('reportesContainer');
    if (!container) return;
    container.innerHTML = `
      <div class="report-card"><canvas id="chartVentas"></canvas></div>
      <div class="report-card" style="margin-top:2rem;"><canvas id="chartProductos"></canvas></div>
      <div class="report-card" style="margin-top:2rem;"><canvas id="chartMetodos"></canvas></div>
    `;

    try {
      const [ventas, topProductos, metodos] = await Promise.all([
        api.get('/gerente/reportes/ventas'),
        api.get('/gerente/reportes/productos-mas-vendidos'),
        api.get('/gerente/reportes/ventas-por-metodo')
      ]);

      if (ventas.length) {
        new Chart(document.getElementById('chartVentas'), {
          type: 'bar',
          data: {
            labels: ventas.map(v => v.fecha),
            datasets: [{ label: 'Total USD', data: ventas.map(v => parseFloat(v.total_usd)), backgroundColor: '#f59e0b' }]
          },
          options: { responsive: true, plugins: { title: { display: true, text: 'Ventas últimos días (USD)' } } }
        });
      }

      if (topProductos.length) {
        new Chart(document.getElementById('chartProductos'), {
          type: 'bar',
          data: {
            labels: topProductos.map(p => p.nombre),
            datasets: [{ label: 'Cantidad vendida', data: topProductos.map(p => parseFloat(p.total_vendido)), backgroundColor: '#10b981' }]
          },
          options: { indexAxis: 'y', plugins: { title: { display: true, text: 'Top productos más vendidos' } } }
        });
      }

      if (metodos.length) {
        new Chart(document.getElementById('chartMetodos'), {
          type: 'pie',
          data: {
            labels: metodos.map(m => m.metodo_pago),
            datasets: [{ data: metodos.map(m => parseFloat(m.total_usd)), backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'] }]
          },
          options: { plugins: { title: { display: true, text: 'Ventas por método de pago (USD)' } } }
        });
      }
    } catch (e) {
      console.error(e);
      container.innerHTML = '<p>Error al cargar reportes.</p>';
    }
  }

  // ========== NAVEGACIÓN ==========
  window.addEventListener('hashchange', () => {
    const view = window.location.hash.substring(1);
    if (view === 'view-admin-products') loadAdminProducts();
    else if (view === 'view-admin-users') loadUsers();
    else if (view === 'view-admin-almacenes') loadAlmacenes();
    else if (view === 'view-admin-proveedores') loadProveedores();
    else if (view === 'view-admin-devoluciones') loadDevoluciones();
    else if (view === 'view-admin-reportes') loadReports();
  });

  const initialView = window.location.hash.substring(1);
  if (initialView === 'view-admin-products') loadAdminProducts();
  else if (initialView === 'view-admin-users') loadUsers();
  else if (initialView === 'view-admin-almacenes') loadAlmacenes();
  else if (initialView === 'view-admin-proveedores') loadProveedores();
  else if (initialView === 'view-admin-devoluciones') loadDevoluciones();
  else if (initialView === 'view-admin-reportes') loadReports();
}