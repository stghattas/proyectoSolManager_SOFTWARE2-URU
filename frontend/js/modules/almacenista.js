// modules/almacenista.js - Funcionalidades de almacenista y administración de inventario
import { getProducts, apiFetch } from '../utils/api.js';

let adminProductos = [];
let adminAlmacenes = [];
let adminProveedores = [];
let movements = [];
let purchases = [];

let elements = {};

export function initAlmacenista(refs) {
  elements = {
    // Productos
    adminProductGrid: refs.adminProductGrid,
    btnAddProduct: refs.btnAddProduct,
    // Almacenes
    adminAlmacenList: refs.adminAlmacenList,
    btnAddAlmacen: refs.btnAddAlmacen,
    // Proveedores
    adminProveedorList: refs.adminProveedorList,
    btnAddProveedor: refs.btnAddProveedor,
    // Movimientos
    movementsContainer: refs.movementsContainer,
    // Ajustes
    adjustProduct: refs.adjustProduct,
    adjustWarehouse: refs.adjustWarehouse,
    adjustmentForm: refs.adjustmentForm,
    adjustmentResult: refs.adjustmentResult,
    // Compras
    purchasesContainer: refs.purchasesContainer,
    btnNewPurchase: refs.btnNewPurchase
  };

  // Asignar eventos
  if (elements.btnAddProduct) elements.btnAddProduct.addEventListener('click', openCreateProductModal);
  if (elements.btnAddAlmacen) elements.btnAddAlmacen.addEventListener('click', openCreateAlmacenModal);
  if (elements.btnAddProveedor) elements.btnAddProveedor.addEventListener('click', openCreateProveedorModal);
  if (elements.adjustmentForm) elements.adjustmentForm.addEventListener('submit', submitAdjustment);
  if (elements.btnNewPurchase) elements.btnNewPurchase.addEventListener('click', openNewPurchase);

  // Carga inicial de datos
  loadAllData();
}

export async function loadAllData() {
  await loadWarehouseProducts();
  await loadWarehouseWarehouses();
  await loadWarehouseSuppliers();
  await loadAdminProducts();
  await loadAdminAlmacenes();
  await loadAdminProveedores();
  await loadMovements();
  await loadPurchases();
}

// ---------- PRODUCTOS ----------
async function loadAdminProducts() {
  try {
    const data = await apiFetch('/warehouse/products');
    adminProductos = data;
    renderAdminProducts(data);
  } catch (e) {
    console.error('Error productos admin:', e);
  }
}

async function loadWarehouseProducts() {
  try {
    const products = await getProducts();
    adminProductos = products;
    if (elements.adjustProduct) {
      elements.adjustProduct.innerHTML = '<option value="">Seleccionar producto</option>';
      products.forEach(p => {
        elements.adjustProduct.innerHTML += `<option value="${p.id}">${p.name}</option>`;
      });
    }
  } catch (e) {
    console.error('Error warehouse products:', e);
  }
}

function renderAdminProducts(products) {
  if (!elements.adminProductGrid) return;
  if (!products.length) {
    elements.adminProductGrid.innerHTML = '<p>No hay productos.</p>';
    return;
  }
  elements.adminProductGrid.innerHTML = products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-image-placeholder">${p.icon || '📦'}</div>
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-unit">${p.unit_base || ''}</div>
        <div class="product-prices">
          <div class="price-usd">$${parseFloat(p.price_usd||0).toFixed(2)}</div>
          <div class="price-ves">Bs. ${parseFloat(p.price_ves||0).toFixed(2)}</div>
          <div style="font-size:0.7rem; color:${p.active ? '#10b981' : '#ef4444'}">${p.active ? 'Activo' : 'Inactivo'}</div>
        </div>
      </div>
      <div class="admin-card-buttons">
        <button class="btn-action-card btn-admin-edit" data-id="${p.id}">✏️ Editar</button>
        <button class="btn-action-card btn-admin-delete" data-id="${p.id}">🗑️ ${p.active ? 'Desactivar' : 'Activar'}</button>
      </div>
    </div>
  `).join('');

  // Eventos de botones
  elements.adminProductGrid.querySelectorAll('.btn-admin-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditProductModal(parseInt(btn.dataset.id)));
  });
  elements.adminProductGrid.querySelectorAll('.btn-admin-delete').forEach(btn => {
    btn.addEventListener('click', () => toggleProductStatus(parseInt(btn.dataset.id)));
  });
}

function openCreateProductModal() {
  const name = prompt('Nombre del producto:');
  if (!name) return;
  const description = prompt('Descripción:') || '';
  const category = prompt('Categoría (fruta_verdura, enlatado, carne, pescado, viveres, lacteos):') || 'general';
  const unit_base = prompt('Unidad base (kg, bulto, lata):') || 'unidad';
  const price_buy_ves = parseFloat(prompt('Precio de compra (VES):')) || 0;
  const price_sell_ves = parseFloat(prompt('Precio de venta (VES):')) || 0;
  const price_sell_usd = parseFloat(prompt('Precio de venta (USD):')) || 0;

  apiFetch('/warehouse/products', {
    method: 'POST',
    body: JSON.stringify({
      nombre: name, descripcion: description, categoria: category,
      unidad_base: unit_base, precio_compra_ves: price_buy_ves,
      precio_venta_ves: price_sell_ves, precio_venta_usd: price_sell_usd
    })
  }).then(() => { alert('✅ Producto creado'); loadAdminProducts(); })
    .catch(err => alert('❌ Error: ' + err.message));
}

function openEditProductModal(id) {
  const product = adminProductos.find(p => p.id === id);
  if (!product) return;
  const name = prompt('Nombre:', product.name) || product.name;
  const description = prompt('Descripción:', product.description || '') || product.description;
  const category = prompt('Categoría:', product.category || '') || product.category;
  const unit_base = prompt('Unidad base:', product.unit_base || '') || product.unit_base;
  const price_buy_ves = parseFloat(prompt('Precio compra VES:', product.precio_compra_ves)) || product.precio_compra_ves;
  const price_sell_ves = parseFloat(prompt('Precio venta VES:', product.price_ves)) || product.price_ves;
  const price_sell_usd = parseFloat(prompt('Precio venta USD:', product.price_usd)) || product.price_usd;

  apiFetch(`/warehouse/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: name, descripcion: description, categoria: category,
      unidad_base: unit_base, precio_compra_ves: price_buy_ves,
      precio_venta_ves: price_sell_ves, precio_venta_usd: price_sell_usd
    })
  }).then(() => { alert('✅ Producto actualizado'); loadAdminProducts(); })
    .catch(err => alert('❌ Error: ' + err.message));
}

async function toggleProductStatus(id) {
  const product = adminProductos.find(p => p.id === id);
  if (!product) return;
  const newStatus = !product.active;
  if (!confirm(`¿${newStatus ? 'Activar' : 'Desactivar'} "${product.name}"?`)) return;
  try {
    await apiFetch(`/warehouse/products/${id}`, { method: 'PUT', body: JSON.stringify({ activo: newStatus }) });
    alert(`✅ Producto ${newStatus ? 'activado' : 'desactivado'}`);
    loadAdminProducts();
  } catch (err) { alert('❌ Error: ' + err.message); }
}

// ---------- ALMACENES ----------
async function loadAdminAlmacenes() {
  try {
    adminAlmacenes = await apiFetch('/warehouse/warehouses');
    renderAdminAlmacenes(adminAlmacenes);
  } catch (e) { console.error(e); }
}

async function loadWarehouseWarehouses() {
  try {
    adminAlmacenes = await apiFetch('/warehouse/warehouses');
    if (elements.adjustWarehouse) {
      elements.adjustWarehouse.innerHTML = '<option value="">Seleccionar almacén</option>';
      adminAlmacenes.forEach(a => {
        elements.adjustWarehouse.innerHTML += `<option value="${a.id_almacen}">${a.nombre}</option>`;
      });
    }
  } catch (e) { console.error(e); }
}

function renderAdminAlmacenes(almacenes) {
  if (!elements.adminAlmacenList) return;
  if (!almacenes.length) {
    elements.adminAlmacenList.innerHTML = '<p>No hay almacenes.</p>';
    return;
  }
  elements.adminAlmacenList.innerHTML = almacenes.map(a => `
    <div style="background:var(--color-bg-card); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:var(--spacing-md); margin-bottom:var(--spacing-sm);">
      <strong>${a.nombre}</strong> (${a.tipo})<br>${a.ubicacion || 'Sin ubicación'}
    </div>
  `).join('');
}

function openCreateAlmacenModal() {
  const nombre = prompt('Nombre del almacén:');
  if (!nombre) return;
  const ubicacion = prompt('Ubicación:') || '';
  const tipo = prompt('Tipo (fisico/logico):') || 'fisico';
  apiFetch('/warehouse/warehouses', { method: 'POST', body: JSON.stringify({ nombre, ubicacion, tipo }) })
    .then(() => { alert('✅ Almacén creado'); loadAdminAlmacenes(); loadWarehouseWarehouses(); })
    .catch(err => alert('❌ Error: ' + err.message));
}

// ---------- PROVEEDORES ----------
async function loadAdminProveedores() {
  try {
    adminProveedores = await apiFetch('/warehouse/suppliers');
    renderAdminProveedores(adminProveedores);
  } catch (e) { console.error(e); }
}

async function loadWarehouseSuppliers() {
  try {
    adminProveedores = await apiFetch('/warehouse/suppliers');
  } catch (e) { console.error(e); }
}

function renderAdminProveedores(proveedores) {
  if (!elements.adminProveedorList) return;
  if (!proveedores.length) {
    elements.adminProveedorList.innerHTML = '<p>No hay proveedores.</p>';
    return;
  }
  elements.adminProveedorList.innerHTML = proveedores.map(p => `
    <div style="background:var(--color-bg-card); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:var(--spacing-md); margin-bottom:var(--spacing-sm);">
      <strong>${p.razon_social}</strong> (RIF: ${p.rif})<br>${p.telefono || ''} - ${p.nombre_contacto || ''}
    </div>
  `).join('');
}

function openCreateProveedorModal() {
  const rif = prompt('RIF:');
  if (!rif) return;
  const razon_social = prompt('Razón social:');
  if (!razon_social) return;
  const direccion = prompt('Dirección:') || '';
  const telefono = prompt('Teléfono:') || '';
  const nombre_contacto = prompt('Nombre de contacto:') || '';
  apiFetch('/warehouse/suppliers', { method: 'POST', body: JSON.stringify({ rif, razon_social, direccion, telefono, nombre_contacto }) })
    .then(() => { alert('✅ Proveedor creado'); loadAdminProveedores(); loadWarehouseSuppliers(); })
    .catch(err => alert('❌ Error: ' + err.message));
}

// ---------- MOVIMIENTOS ----------
export async function loadMovements() {
  try {
    movements = await apiFetch('/warehouse/movements');
    renderMovements(movements);
  } catch (e) {
    console.error(e);
    if (elements.movementsContainer) elements.movementsContainer.innerHTML = '<p>Error al cargar movimientos.</p>';
  }
}

function renderMovements(movementsList) {
  if (!elements.movementsContainer) return;
  if (!movementsList.length) {
    elements.movementsContainer.innerHTML = '<p>No hay movimientos registrados.</p>';
    return;
  }
  let html = `<table class="cart-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Almacén</th><th>Tipo</th><th>Cantidad</th><th>Stock actual</th><th>Usuario</th><th>Descripción</th></tr></thead><tbody>`;
  movementsList.forEach(m => {
    const tipoMap = { compra:'Compra', venta:'Venta', devolucion_cliente:'Dev. Cliente', devolucion_proveedor:'Dev. Proveedor', ajuste_perdida:'Pérdida', ajuste_inventario_fisico:'Ajuste físico', transferencia:'Transferencia' };
    const tipoLabel = tipoMap[m.tipo] || m.tipo;
    const color = parseFloat(m.cantidad) >= 0 ? 'green' : 'red';
    html += `<tr><td>${new Date(m.fecha).toLocaleString()}</td><td>${m.producto_nombre}</td><td>${m.almacen_nombre}</td><td>${tipoLabel}</td><td style="color:${color}; font-weight:600;">${m.cantidad}</td><td>${m.cantidad_actual}</td><td>${m.usuario_nombre}</td><td>${m.descripcion||''}</td></tr>`;
  });
  html += '</tbody></table>';
  elements.movementsContainer.innerHTML = html;
}

// ---------- AJUSTES ----------
async function submitAdjustment(e) {
  e.preventDefault();
  const id_producto = elements.adjustProduct.value;
  const id_almacen = elements.adjustWarehouse.value;
  const tipo = document.getElementById('adjustType').value;
  const cantidad = parseFloat(document.getElementById('adjustQuantity').value);
  const descripcion = document.getElementById('adjustDescription').value;
  if (!id_producto || !id_almacen || !tipo || !cantidad) { alert('Completa todos los campos.'); return; }
  try {
    const result = await apiFetch('/warehouse/adjustments', {
      method: 'POST',
      body: JSON.stringify({ id_producto, id_almacen, tipo, cantidad, descripcion })
    });
    if (elements.adjustmentResult) elements.adjustmentResult.innerHTML = `<p style="color:green;">✅ ${result.message}</p>`;
    elements.adjustmentForm.reset();
    loadMovements();
    loadWarehouseProducts(); // actualizar selects
  } catch (err) {
    if (elements.adjustmentResult) elements.adjustmentResult.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// ---------- COMPRAS ----------
async function loadPurchases() {
  try {
    purchases = await apiFetch('/warehouse/purchases');
    renderPurchases(purchases);
  } catch (e) {
    console.error(e);
    if (elements.purchasesContainer) elements.purchasesContainer.innerHTML = '<p>Error al cargar compras.</p>';
  }
}

function renderPurchases(purchasesList) {
  if (!elements.purchasesContainer) return;
  if (!purchasesList.length) {
    elements.purchasesContainer.innerHTML = '<p>No hay compras registradas.</p>';
    return;
  }
  let html = `<table class="cart-table"><thead><tr><th>Fecha</th><th>Factura</th><th>Proveedor</th><th>Almacén</th><th>Total VES</th><th>Total USD</th><th>Empleado</th><th>Detalles</th></tr></thead><tbody>`;
  purchasesList.forEach(p => {
    html += `<tr><td>${new Date(p.fecha_compra).toLocaleDateString()}</td><td>${p.numero_factura_proveedor}</td><td>${p.proveedor_nombre}</td><td>${p.almacen_nombre}</td><td>${parseFloat(p.total_compra_ves).toFixed(2)}</td><td>${parseFloat(p.total_compra_usd).toFixed(2)}</td><td>${p.empleado_nombre}</td><td><button class="btn-detail-purchase" data-id="${p.id_compra}">Ver</button></td></tr>`;
  });
  html += '</tbody></table>';
  elements.purchasesContainer.innerHTML = html;

  elements.purchasesContainer.querySelectorAll('.btn-detail-purchase').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      try {
        const details = await apiFetch(`/warehouse/purchases/${id}`);
        alert('🧾 Detalles:\n' + details.map(d => `${d.producto_nombre} - ${d.cantidad} ${d.unidad_base} - ${d.precio_unitario_ves} VES / ${d.precio_unitario_usd} USD`).join('\n'));
      } catch (err) { alert('❌ Error: ' + err.message); }
    });
  });
}

function openNewPurchase() {
  const proveedorId = prompt('ID del proveedor:');
  if (!proveedorId) return;
  const almacenId = prompt('ID del almacén:');
  if (!almacenId) return;
  const factura = prompt('Número de factura:');
  if (!factura) return;
  const fecha = prompt('Fecha (YYYY-MM-DD):');
  if (!fecha) return;

  let detalles = [];
  while (true) {
    const productoId = prompt('ID del producto (0 para terminar):');
    if (!productoId || productoId === '0') break;
    const cantidad = prompt('Cantidad:'); if (!cantidad) continue;
    const precioVes = prompt('Precio unitario VES:'); if (!precioVes) continue;
    const precioUsd = prompt('Precio unitario USD:'); if (!precioUsd) continue;
    detalles.push({ id_producto: parseInt(productoId), cantidad: parseFloat(cantidad), precio_unitario_ves: parseFloat(precioVes), precio_unitario_usd: parseFloat(precioUsd) });
  }
  if (!detalles.length) { alert('Agrega al menos un producto.'); return; }
  apiFetch('/warehouse/purchases', { method: 'POST', body: JSON.stringify({ id_proveedor: parseInt(proveedorId), id_almacen_destino: parseInt(almacenId), numero_factura_proveedor: factura, fecha_compra: fecha, detalles }) })
    .then(() => { alert('✅ Compra registrada'); loadPurchases(); loadMovements(); })
    .catch(err => alert('❌ Error: ' + err.message));
}