export function init(api, user) {
  // Movimientos (placeholder)
  const movementsContainer = document.getElementById('movementsContainer');
  if (movementsContainer) movementsContainer.innerHTML = '<p>Últimos movimientos (próximamente)</p>';

  // Compras a proveedores
  const purchasesContainer = document.getElementById('purchasesContainer');
  const btnNewPurchase = document.getElementById('btnNewPurchase');
  btnNewPurchase?.addEventListener('click', () => {
    const html = `
      <div class="config-section" style="margin-top:1rem;">
        <h3>Nueva Compra</h3>
        <select id="newPurchaseProveedor" class="search-input" style="width:100%;margin-bottom:0.5rem;">
          <option value="">Seleccionar proveedor</option>
        </select>
        <div id="newPurchaseItems"></div>
        <button id="addPurchaseItem" class="btn-save-config" style="margin-top:0.5rem;">+ Agregar producto</button>
        <button id="savePurchase" class="btn-checkout" style="margin-top:1rem;">Guardar compra</button>
        <div id="purchaseResult" style="margin-top:0.5rem;"></div>
      </div>
    `;
    purchasesContainer.insertAdjacentHTML('beforeend', html);
    cargarProveedores();
    agregarLineaProducto();
    document.getElementById('addPurchaseItem')?.addEventListener('click', agregarLineaProducto);
    document.getElementById('savePurchase')?.addEventListener('click', guardarCompra);
  });

  function agregarLineaProducto() {
    const itemsDiv = document.getElementById('newPurchaseItems');
    itemsDiv.innerHTML += `
      <div class="purchase-item" style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
        <select class="purchase-product" style="flex:2;"><option value="">Producto</option></select>
        <input type="number" class="purchase-qty" placeholder="Cantidad" style="flex:1;" step="0.01">
        <input type="number" class="purchase-price-usd" placeholder="Precio USD" style="flex:1;" step="0.01">
        <button class="cart-remove remove-purchase-item">X</button>
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
          select.innerHTML = '<option value="">Producto</option>' + prods.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
        }
      });
    } catch (e) { console.error(e); }
  }

  async function cargarProveedores() {
    try {
      const provs = await api.get('/gerente/proveedores'); // temporal
      const select = document.getElementById('newPurchaseProveedor');
      if (select) select.innerHTML = '<option value="">Seleccionar proveedor</option>' + provs.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    } catch (e) { /* sin proveedores aún */ }
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
        // Recargar lista de compras (pendiente implementar endpoint de historial)
      }, 1500);
    } catch (err) {
      document.getElementById('purchaseResult').textContent = 'Error: ' + err.message;
    }
  }

  // Ajustes de inventario
  const adjustmentForm = document.getElementById('adjustmentForm');
  async function cargarSelectsAjuste() {
    try {
      const prods = await api.get('/productos');
      const selectProd = document.getElementById('adjustProduct');
      if (selectProd) selectProd.innerHTML = '<option value="">Seleccionar producto</option>' + prods.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    } catch (e) { console.error(e); }
    // Almacenes
    try {
      const almacenes = await api.get('/almacenes');
      const selectAlm = document.getElementById('adjustWarehouse');
      if (selectAlm) selectAlm.innerHTML = '<option value="">Seleccionar almacén</option>' + almacenes.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
    } catch (e) {
      document.getElementById('adjustWarehouse').innerHTML = '<option value="a1000000-0000-0000-0000-000000000001">Almacén Principal</option>';
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
        unidad_id: 'e0000000-0000-0000-0000-000000000001', // ud, idealmente tomarla del producto
        motivo: descripcion
      });
      document.getElementById('adjustmentResult').textContent = 'Ajuste registrado exitosamente';
      adjustmentForm.reset();
    } catch (err) {
      document.getElementById('adjustmentResult').textContent = 'Error: ' + err.message;
    }
  });

  // Alertas de stock
  async function loadStockAlerts() {
    const container = document.getElementById('stockAlertsContainer');
    if (!container) return;
    try {
      const alertas = await api.get('/almacenista/alertas-stock');
      container.innerHTML = alertas.length ? 
        `<table class="cart-table"><tr><th>Producto</th><th>Stock</th><th>Mínimo</th></tr>
        ${alertas.map(a => `<tr><td>${a.nombre}</td><td>${a.cantidad}</td><td>${a.stock_minimo}</td></tr>`).join('')}
        </table>` : '<p>No hay productos con stock bajo</p>';
    } catch (e) { container.innerHTML = '<p>Error al cargar alertas</p>'; }
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#view-warehouse-alerts') loadStockAlerts();
    else if (window.location.hash === '#view-warehouse-adjustments') cargarSelectsAjuste();
  });
  loadStockAlerts();
}