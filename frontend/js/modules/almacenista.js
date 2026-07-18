// almacenista.js – Módulo completo para el rol almacenista

export function init(api, user) {

  // =========================================================
  // 1. INICIO: mostrar productos
  // =========================================================
  async function loadHomeProducts() {
    const container = document.getElementById('productGridContainer');
    if (!container) return;
    try {
      const productos = await api.get('/productos');
      renderProductGrid(container, productos);
    } catch (err) {
      container.innerHTML = `<p class="error">Error al cargar productos: ${err.message}</p>`;
    }
  }

  function renderProductGrid(container, productos) {
    container.innerHTML = productos.map(p => {
      let emoji = '📦';
      if (p.imagen_url && p.imagen_url.length <= 4) emoji = p.imagen_url;
      return `
        <div class="product-card">
          <div class="product-emoji">${emoji}</div>
          <div class="product-info">
            <h3 class="product-name">${p.nombre}</h3>
            <p class="product-unit">${p.unidad_abreviatura || 'ud'}</p>
            <div class="product-prices">
              <span class="price-usd">$${parseFloat(p.precio_usd).toFixed(2)}</span>
              <span class="price-bs">Bs.${parseFloat(p.precio_bs).toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================
  // 2. MOVIMIENTOS DE STOCK (últimos)
  // =========================================================
  const movementsContainer = document.getElementById('movementsContainer');

  async function loadMovements() {
    if (!movementsContainer) return;
    try {
      const movs = await api.get('/almacenista/movimientos');
      movementsContainer.innerHTML = movs.length ? `
        <table class="cart-table">
          <thead>
            <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Almacén</th></tr>
          </thead>
          <tbody>
            ${movs.map(m => `
              <tr>
                <td>${new Date(m.fecha).toLocaleString()}</td>
                <td>${m.producto_nombre}</td>
                <td>${m.tipo}</td>
                <td>${m.cantidad}</td>
                <td>${m.almacen_nombre}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p>No hay movimientos registrados.</p>';
    } catch (e) {
      movementsContainer.innerHTML = '<p>Error al cargar movimientos.</p>';
    }
  }

  // =========================================================
  // 3. COMPRAS A PROVEEDORES
  // =========================================================
  const purchasesContainer = document.getElementById('purchasesContainer');
  const btnNewPurchase = document.getElementById('btnNewPurchase');

  btnNewPurchase?.addEventListener('click', () => {
    const html = `
      <div class="config-section" style="margin-top:1rem;">
        <h3>🛒 Nueva Compra a Proveedor</h3>
        <div class="form-group">
          <label>Proveedor</label>
          <select id="newPurchaseProveedor" class="search-input" style="width:100%;">
            <option value="">Seleccionar proveedor</option>
          </select>
        </div>
        <div id="newPurchaseItems"></div>
        <button id="addPurchaseItem" class="btn-admin-add" style="margin-top:0.5rem;">+ Agregar producto</button>
        <div id="purchaseResult" style="margin-top:0.5rem;"></div>
        <button id="savePurchase" class="btn-checkout" style="margin-top:1rem;">Guardar compra</button>
      </div>
    `;
    purchasesContainer.insertAdjacentHTML('beforeend', html);
    cargarProveedores();
    agregarLineaProducto(); // línea inicial
    document.getElementById('addPurchaseItem')?.addEventListener('click', agregarLineaProducto);
    document.getElementById('savePurchase')?.addEventListener('click', guardarCompra);
  });

  function agregarLineaProducto() {
    const itemsDiv = document.getElementById('newPurchaseItems');
    itemsDiv.innerHTML += `
      <div class="purchase-item" style="display:flex; gap:0.5rem; margin-bottom:0.5rem; align-items:center;">
        <div style="flex:2;">
          <label style="display:block; font-size:0.8rem;">Producto</label>
          <select class="purchase-product search-input" style="width:100%;"><option value="">Seleccione</option></select>
        </div>
        <div style="flex:1;">
          <label style="display:block; font-size:0.8rem;">Cantidad</label>
          <input type="number" class="purchase-qty search-input" placeholder="Cant." step="0.01" style="width:100%;">
        </div>
        <div style="flex:1;">
          <label style="display:block; font-size:0.8rem;">Precio USD</label>
          <input type="number" class="purchase-price-usd search-input" placeholder="Precio" step="0.01" style="width:100%;">
        </div>
        <button class="cart-remove remove-purchase-item" style="align-self:flex-end;">X</button>
      </div>
    `;
    cargarProductos();
    document.querySelectorAll('.remove-purchase-item').forEach(btn => {
      btn.addEventListener('click', (e) => e.target.closest('.purchase-item').remove());
    });
  }

  async function cargarProductos() {
    try {
      const prods = await api.get('/productos');
      document.querySelectorAll('.purchase-product').forEach(select => {
        if (select.options.length <= 1) {
          select.innerHTML = '<option value="">Seleccione</option>' +
            prods.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
        }
      });
    } catch (e) { console.error(e); }
  }

  async function cargarProveedores() {
    try {
      const provs = await api.get('/gerente/proveedores'); // Ajusta la ruta según tu API
      const select = document.getElementById('newPurchaseProveedor');
      if (select) {
        select.innerHTML = '<option value="">Seleccionar proveedor</option>' +
          provs.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
      }
    } catch (e) { /* Aún sin proveedores */ }
  }

  async function guardarCompra() {
    const proveedorId = document.getElementById('newPurchaseProveedor').value;
    if (!proveedorId) return alert('Seleccione un proveedor');
    const items = [];
    document.querySelectorAll('.purchase-item').forEach(item => {
      const producto = item.querySelector('.purchase-product').value;
      const qty = parseFloat(item.querySelector('.purchase-qty').value);
      const precio = parseFloat(item.querySelector('.purchase-price-usd').value);
      if (producto && qty > 0) items.push({ producto_id: producto, cantidad: qty, precio_usd: precio });
    });
    if (items.length === 0) return alert('Agregue al menos un producto');
    try {
      await api.post('/almacenista/compras', { proveedor_id: proveedorId, items });
      document.getElementById('purchaseResult').textContent = 'Compra registrada exitosamente';
      setTimeout(() => {
        const form = document.querySelector('.config-section');
        if (form) form.remove();
        // Aquí podrías recargar la lista de compras si tuvieras un endpoint
      }, 1500);
    } catch (err) {
      document.getElementById('purchaseResult').textContent = 'Error: ' + err.message;
    }
  }

  // =========================================================
  // 4. AJUSTES DE INVENTARIO
  // =========================================================
  const adjustmentForm = document.getElementById('adjustmentForm');

  async function cargarSelectsAjuste() {
    // Ajustar los tipos de movimiento para que coincidan con el CHECK de la BD
    const adjustType = document.getElementById('adjustType');
    if (adjustType) {
      adjustType.innerHTML = `
        <option value="">Seleccionar tipo</option>
        <option value="entrada">Entrada (Compra)</option>
        <option value="salida">Salida (Venta)</option>
        <option value="ajuste">Ajuste (Físico)</option>
        <option value="merma">Merma</option>
        <option value="transferencia">Transferencia</option>
      `;
    }

    // Cargar productos
    try {
      const prods = await api.get('/productos');
      const selectProd = document.getElementById('adjustProduct');
      if (selectProd) {
        selectProd.innerHTML = '<option value="">Seleccionar producto</option>' +
          prods.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
      }
    } catch (e) { console.error(e); }

    // Cargar almacenes
    try {
      const almacenes = await api.get('/almacenes');
      const selectAlm = document.getElementById('adjustWarehouse');
      if (selectAlm) {
        selectAlm.innerHTML = '<option value="">Seleccionar almacén</option>' +
          almacenes.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
      }
    } catch (e) {
      // Fallback con el almacén principal
      const selectAlm = document.getElementById('adjustWarehouse');
      if (selectAlm) selectAlm.innerHTML = '<option value="a1000000-0000-0000-0000-000000000001">Almacén Principal</option>';
    }
  }

  cargarSelectsAjuste();

  adjustmentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const producto = document.getElementById('adjustProduct').value;
    const almacen = document.getElementById('adjustWarehouse').value;
    const tipo = document.getElementById('adjustType').value;
    const cantidad = parseFloat(document.getElementById('adjustQuantity').value);
    const descripcion = document.getElementById('adjustDescription').value;
    if (!producto || !almacen || !tipo || !cantidad) {
      alert('Complete todos los campos');
      return;
    }
    try {
      await api.post('/almacenista/movimiento', {
        producto_id: producto,
        almacen_id: almacen,
        tipo,
        cantidad,
        unidad_id: 'e0000000-0000-0000-0000-000000000001', // unidad por defecto; idealmente tomarla del producto
        motivo: descripcion
      });
      document.getElementById('adjustmentResult').textContent = 'Ajuste registrado exitosamente';
      adjustmentForm.reset();
      // Recargar movimientos
      loadMovements();
    } catch (err) {
      document.getElementById('adjustmentResult').textContent = 'Error: ' + err.message;
    }
  });

  // =========================================================
  // 5. ALERTAS DE STOCK BAJO
  // =========================================================
  const stockAlertsContainer = document.getElementById('stockAlertsContainer');

  async function loadStockAlerts() {
    if (!stockAlertsContainer) return;
    try {
      const alertas = await api.get('/almacenista/alertas-stock');
      stockAlertsContainer.innerHTML = alertas.length ? `
        <table class="cart-table">
          <thead>
            <tr><th>Producto</th><th>Stock actual</th><th>Stock mínimo</th></tr>
          </thead>
          <tbody>
            ${alertas.map(a => `
              <tr>
                <td>${a.nombre}</td>
                <td>${a.cantidad}</td>
                <td>${a.stock_minimo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p>No hay productos con stock bajo.</p>';
    } catch (e) {
      stockAlertsContainer.innerHTML = '<p>Error al cargar alertas.</p>';
    }
  }

  // =========================================================
  // 6. CONTROL DE NAVEGACIÓN ENTRE VISTAS
  // =========================================================
  window.addEventListener('hashchange', () => {
    const view = window.location.hash.substring(1);
    if (view === 'view-home') loadHomeProducts();
    else if (view === 'view-warehouse-movements') loadMovements();
    else if (view === 'view-warehouse-adjustments') cargarSelectsAjuste();
    else if (view === 'view-warehouse-alerts') loadStockAlerts();
    // Si quieres cargar compras al entrar, puedes agregar un endpoint de historial
  });

  // Inicialización según la vista actual
  const currentView = window.location.hash.substring(1);
  if (currentView === 'view-home' || currentView === '') loadHomeProducts();
  if (currentView === 'view-warehouse-movements') loadMovements();
  if (currentView === 'view-warehouse-alerts') loadStockAlerts();
}