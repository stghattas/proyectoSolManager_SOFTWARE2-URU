// modules/cliente.js - Cliente completo con pago mejorado, emojis, devoluciones y configuración que guarda
import { getProducts, apiFetch } from '../utils/api.js';

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('solCart')) || [];
let selectedProduct = null;

let config = JSON.parse(localStorage.getItem('solConfig')) || {
  name: '', phone: '', address: '', notifOffers: true, notifOrders: true
};

let productGridContainer, catalogProductGrid, catalogCategories;
let cartTableBody, summarySubtotal, summaryTotalUSD, summaryTotalVES;
let ordersContainer, ordersFilter;
let modal, closeModal, detailName, detailUnit, detailPrice, detailAddToCart, btnCheckout;
let catalogSearch, catalogSort, catalogCount;
let configElements = {};

let paymentModal, closePaymentModal, paymentAddress, paymentMethodSelect;
let pagoMovilFields, transferenciaFields, tarjetaFields;
let pmBanco, pmTelefono, pmCedula;
let transfBanco, transfReferencia;
let tarjetaNumero, tarjetaTitular, tarjetaVencimiento, tarjetaCVV;
let btnConfirmPayment, paymentMsg, paymentSummary;

const categoryIcons = {
  fruta_verdura: ' 🍌', enlatado: '🥫', carne: '🥩', pescado: '🐟', viveres: '🌾', lacteos: '🧀'
};

export function initCliente(refs) {
  ({
    productGridContainer, catalogProductGrid, catalogCategories,
    cartTableBody, summarySubtotal, summaryTotalUSD, summaryTotalVES,
    ordersContainer, ordersFilter,
    modal, closeModal, detailName, detailUnit, detailPrice, detailAddToCart, btnCheckout,
    catalogSearch, catalogSort, catalogCount,
    configElements,
    paymentModal, closePaymentModal, paymentAddress, paymentMethodSelect,
    pagoMovilFields, transferenciaFields, tarjetaFields,
    pmBanco, pmTelefono, pmCedula,
    transfBanco, transfReferencia,
    tarjetaNumero, tarjetaTitular, tarjetaVencimiento, tarjetaCVV,
    btnConfirmPayment, paymentMsg, paymentSummary
  } = refs.elements);

  closeModal?.addEventListener('click', () => modal.style.display = 'none');
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  detailAddToCart?.addEventListener('click', () => {
    const id = parseInt(detailAddToCart.dataset.id);
    const p = allProducts.find(prod => prod.id === id);
    if (p) { addToCart(p); alert('✅ Agregado'); modal.style.display = 'none'; }
  });

  catalogSearch?.addEventListener('input', updateCatalog);
  catalogSort?.addEventListener('change', updateCatalog);
  ordersFilter?.addEventListener('change', renderOrders);

  if (btnCheckout) btnCheckout.addEventListener('click', openPaymentModal);

  closePaymentModal?.addEventListener('click', () => paymentModal.style.display = 'none');
  paymentModal?.addEventListener('click', (e) => { if (e.target === paymentModal) paymentModal.style.display = 'none'; });
  paymentMethodSelect?.addEventListener('change', togglePaymentFields);
  btnConfirmPayment?.addEventListener('click', processPayment);

  document.getElementById('btnDownloadInvoice')?.addEventListener('click', () => {
    const orderId = parseInt(document.getElementById('paymentSuccessView').dataset.orderId);
    const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (order) generarFacturaPNG(order);
    paymentModal.style.display = 'none';
  });
  document.getElementById('btnClosePayment')?.addEventListener('click', () => {
    paymentModal.style.display = 'none';
  });

  loadProducts();
  renderCart();
  renderOrders();
  initConfig();
}

export async function loadProducts() {
  try {
    allProducts = await getProducts();
    renderHomeProducts(allProducts);
    renderCatalogCategories(allProducts);
    updateCatalog();
  } catch (e) {
    if (productGridContainer) productGridContainer.innerHTML = '<p style="color:red;">Error al cargar productos.</p>';
  }
}

export function renderHomeProducts(products) {
  if (!productGridContainer) return;
  productGridContainer.innerHTML = products.length ? products.slice(0,8).map(p => createProductCard(p)).join('') : '<p>No hay productos.</p>';
  attachProductEvents();
}

function createProductCard(p) {
  const priceUSD = parseFloat(p.price_usd || 0);
  const priceVES = parseFloat(p.price_ves || 0);
  const icon = p.icon || categoryIcons[p.category] || '📦';
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-image-placeholder">${icon}</div>
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-unit">${p.unit_base || ''}</div>
        <div class="product-prices">
          <div class="price-usd">$${priceUSD.toFixed(2)}</div>
          <div class="price-ves">Bs. ${priceVES.toFixed(2)}</div>
        </div>
      </div>
      <button class="btn-action-card btn-add-cart" data-id="${p.id}">➕ Agregar</button>
      <button class="btn-action-card btn-detail" data-id="${p.id}" style="margin-top:4px; background:transparent; border:1px solid var(--color-primary);">🔍 Detalles</button>
    </div>
  `;
}

function attachProductEvents() {
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.onclick = () => {
      const p = allProducts.find(prod => prod.id === parseInt(btn.dataset.id));
      if (p) { addToCart(p); alert('✅ Agregado al carrito'); }
    };
  });
  document.querySelectorAll('.btn-detail').forEach(btn => {
    btn.onclick = () => {
      const p = allProducts.find(prod => prod.id === parseInt(btn.dataset.id));
      if (p) {
        detailName.textContent = p.name;
        detailUnit.textContent = p.unit_base || 'Unidad';
        detailPrice.textContent = `$${parseFloat(p.price_usd||0).toFixed(2)} / Bs. ${parseFloat(p.price_ves||0).toFixed(2)}`;
        modal.style.display = 'flex';
        detailAddToCart.dataset.id = p.id;
      }
    };
  });
}

export function renderCatalogCategories(products) {
  if (!catalogCategories) return;
  const cats = [...new Set(products.map(p => p.category || 'General'))];
  let html = `<div class="category-card active" data-category="all"><span class="category-icon">📋</span><div><strong>Todos</strong><span style="font-size:0.8rem;display:block;">${products.length} productos</span></div></div>`;
  cats.forEach(cat => {
    const icon = categoryIcons[cat] || '📂';
    html += `<div class="category-card" data-category="${cat}"><span class="category-icon">${icon}</span><div><strong>${cat.replace('_',' ')}</strong><span style="font-size:0.8rem;display:block;">${products.filter(p=>(p.category||'General')===cat).length} productos</span></div></div>`;
  });
  catalogCategories.innerHTML = html;
  catalogCategories.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      catalogCategories.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      updateCatalog();
    });
  });
}

function updateCatalog() {
  if (!catalogProductGrid) return;
  const activeCat = catalogCategories?.querySelector('.category-card.active')?.dataset.category || 'all';
  const search = catalogSearch?.value.toLowerCase() || '';
  const sort = catalogSort?.value || 'name-asc';
  let list = allProducts.filter(p => {
    const cat = p.category || 'General';
    return (activeCat === 'all' || cat === activeCat) && p.name.toLowerCase().includes(search);
  });
  switch(sort) {
    case 'name-asc': list.sort((a,b) => a.name.localeCompare(b.name)); break;
    case 'name-desc': list.sort((a,b) => b.name.localeCompare(a.name)); break;
    case 'price-asc': list.sort((a,b) => parseFloat(a.price_usd||0)-parseFloat(b.price_usd||0)); break;
    case 'price-desc': list.sort((a,b) => parseFloat(b.price_usd||0)-parseFloat(a.price_usd||0)); break;
  }
  if (catalogCount) catalogCount.textContent = `${list.length} producto(s)`;
  catalogProductGrid.innerHTML = list.length ? list.map(p => createProductCard(p)).join('') : '<p>Sin resultados.</p>';
  attachProductEvents();
}

export function addToCart(product) {
  const exist = cart.find(i => i.id === product.id);
  if (exist) exist.quantity++;
  else cart.push({...product, quantity:1});
  localStorage.setItem('solCart', JSON.stringify(cart));
  renderCart();
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); localStorage.setItem('solCart', JSON.stringify(cart)); renderCart(); }
function updateQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(id);
  else { localStorage.setItem('solCart', JSON.stringify(cart)); renderCart(); }
}
export function renderCart() {
  if (!cartTableBody) return;
  if (!cart.length) { cartTableBody.innerHTML = '<tr><td colspan="5">🛒 Carrito vacío</td></tr>'; updateSummary(); return; }
  cartTableBody.innerHTML = cart.map(item => `
    <tr>
      <td>${item.name} (${item.unit_base||''})</td>
      <td>$${parseFloat(item.price_usd||0).toFixed(2)} / Bs.${parseFloat(item.price_ves||0).toFixed(2)}</td>
      <td><button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button> ${item.quantity} <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button></td>
      <td>$${(parseFloat(item.price_usd||0)*item.quantity).toFixed(2)}</td>
      <td><button class="btn-delete-item" data-id="${item.id}">🗑️</button></td>
    </tr>`).join('');
  document.querySelectorAll('.qty-btn').forEach(b => b.onclick = () => updateQuantity(parseInt(b.dataset.id), parseInt(b.dataset.delta)));
  document.querySelectorAll('.btn-delete-item').forEach(b => b.onclick = () => removeFromCart(parseInt(b.dataset.id)));
  updateSummary();
}
function updateSummary() {
  const totUSD = cart.reduce((s,i) => s + parseFloat(i.price_usd||0)*i.quantity, 0);
  const totVES = cart.reduce((s,i) => s + parseFloat(i.price_ves||0)*i.quantity, 0);
  if (summarySubtotal) summarySubtotal.textContent = `$${totUSD.toFixed(2)}`;
  if (summaryTotalUSD) summaryTotalUSD.textContent = `$${totUSD.toFixed(2)}`;
  if (summaryTotalVES) summaryTotalVES.textContent = `Bs. ${totVES.toFixed(2)}`;
}

// ===== PAGO =====
function openPaymentModal() {
  if (!cart.length) { alert('Carrito vacío'); return; }
  paymentAddress.value = config.address || '';
  const totalUSD = cart.reduce((s,i) => s + parseFloat(i.price_usd||0)*i.quantity,0);
  const totalVES = cart.reduce((s,i) => s + parseFloat(i.price_ves||0)*i.quantity,0);
  paymentSummary.innerHTML = `<p><strong>Total USD:</strong> $${totalUSD.toFixed(2)} | <strong>VES:</strong> Bs. ${totalVES.toFixed(2)}</p>`;
  pmBanco.value = ''; pmTelefono.value = ''; pmCedula.value = '';
  transfBanco.value = ''; transfReferencia.value = '';
  tarjetaNumero.value = ''; tarjetaTitular.value = ''; tarjetaVencimiento.value = ''; tarjetaCVV.value = '';
  paymentMethodSelect.value = '';
  togglePaymentFields();
  paymentMsg.textContent = '';
  document.getElementById('paymentFormFields').style.display = 'block';
  document.getElementById('paymentSuccessView').style.display = 'none';
  paymentModal.style.display = 'flex';
}

function togglePaymentFields() {
  const method = paymentMethodSelect.value;
  pagoMovilFields.style.display = method === 'pago_movil' ? 'block' : 'none';
  transferenciaFields.style.display = method === 'transferencia' ? 'block' : 'none';
  tarjetaFields.style.display = method === 'tarjeta' ? 'block' : 'none';
}

async function processPayment() {
  const method = paymentMethodSelect.value;
  if (!method) { alert('Seleccione un método de pago.'); return; }
  const address = paymentAddress.value.trim();
  if (!address) { alert('Ingrese la dirección de entrega.'); return; }

  if (method === 'pago_movil' && (!pmBanco.value || !pmTelefono.value || !pmCedula.value)) {
    alert('Complete todos los datos de PagoMóvil.'); return;
  }
  if (method === 'transferencia' && (!transfBanco.value || !transfReferencia.value)) {
    alert('Complete los datos de la transferencia.'); return;
  }
  if (method === 'tarjeta' && (!tarjetaNumero.value || !tarjetaTitular.value || !tarjetaVencimiento.value || !tarjetaCVV.value)) {
    alert('Complete los datos de la tarjeta.'); return;
  }

  const totalUSD = cart.reduce((s,i) => s + parseFloat(i.price_usd||0)*i.quantity,0);
  const totalVES = cart.reduce((s,i) => s + parseFloat(i.price_ves||0)*i.quantity,0);
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    totalUSD, totalVES,
    status: 'pendiente',
    metodoEntrega: 'delivery',
    direccion: address,
    items: cart.map(i => ({ name: i.name, quantity: i.quantity, priceUSD: parseFloat(i.price_usd||0), priceVES: parseFloat(i.price_ves||0) }))
  };
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  orders.push(order);
  localStorage.setItem('solOrders', JSON.stringify(orders));

  try { await apiFetch('/payments', { method: 'POST', body: JSON.stringify({ id_pedido: order.id, monto_ves: totalVES, monto_usd: totalUSD, metodo: method }) }); } catch (e) {}

  cart = [];
  localStorage.setItem('solCart', JSON.stringify(cart));
  renderCart();
  renderOrders();

  document.getElementById('paymentFormFields').style.display = 'none';
  const successView = document.getElementById('paymentSuccessView');
  successView.style.display = 'block';
  successView.dataset.orderId = order.id;
}

function generarFacturaPNG(order) {
  const invoiceDiv = document.getElementById('invoicePrintable');
  const content = document.getElementById('invoiceContent');
  content.innerHTML = `
    <div style="text-align:center; border-bottom:2px solid #f59e0b; padding-bottom:1rem;">
      <h1 style="color:#f59e0b; margin:0;">☀️ Sol-Manager</h1>
      <p style="margin:0;">Factura de compra</p>
    </div>
    <p><strong>Pedido #${order.id}</strong></p>
    <p>Fecha: ${order.date}</p>
    <p>Dirección de entrega: ${order.direccion}</p>
    <table style="width:100%; border-collapse:collapse; margin:1rem 0;">
      <thead style="background:#f59e0b; color:white;">
        <tr><th>Producto</th><th>Cant.</th><th>Precio USD</th><th>Total USD</th></tr>
      </thead>
      <tbody>
        ${order.items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${i.quantity}</td>
            <td>$${i.priceUSD.toFixed(2)}</td>
            <td>$${(i.priceUSD*i.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p style="text-align:right;"><strong>Total USD:</strong> $${order.totalUSD.toFixed(2)}</p>
    <p style="text-align:right;"><strong>Total VES:</strong> Bs. ${order.totalVES.toFixed(2)}</p>
    <div style="text-align:center; border-top:2px solid #f59e0b; padding-top:1rem; margin-top:1rem;">
      <p>Gracias por su compra</p>
    </div>
  `;
  invoiceDiv.style.display = 'block';
  html2canvas(invoiceDiv, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
    const link = document.createElement('a');
    link.download = `factura-${order.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    invoiceDiv.style.display = 'none';
  }).catch(() => {
    alert('No se pudo generar la imagen. Puede imprimir la factura.');
    window.print();
    invoiceDiv.style.display = 'none';
  });
}

// ===== PEDIDOS Y DEVOLUCIONES =====
export function renderOrders() {
  if (!ordersContainer) return;
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  const filter = ordersFilter?.value || 'pendiente';
  const filtered = orders.filter(o => o.status === filter);
  if (!filtered.length) { ordersContainer.innerHTML = '<p>No hay pedidos que coincidan.</p>'; return; }
  ordersContainer.innerHTML = filtered.reverse().map(o => {
    const statusClass = o.status === 'entregado' ? 'entregado' : 'pendiente';
    return `
    <div class="order-card">
      <div class="order-header">
        <span>Pedido #${o.id}</span>
        <span class="order-status ${statusClass}">${o.status.toUpperCase()}</span>
      </div>
      <div>${o.date}</div>
      <div>USD: $${o.totalUSD.toFixed(2)} | VES: Bs.${o.totalVES.toFixed(2)}</div>
      <div>${o.metodoEntrega} - ${o.direccion}</div>
      <div style="margin-top:0.5rem;">
        <button class="btn-toggle-details" data-id="${o.id}">Ver detalles</button>
        ${o.status === 'entregado' ? `<button class="btn-return" data-id="${o.id}">Solicitar devolución</button>` : ''}
      </div>
      <div class="order-details" id="details-${o.id}">
        <table style="width:100%; font-size:0.9rem;">
          <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
          <tbody>${o.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.priceUSD.toFixed(2)}</td><td>$${(i.priceUSD*i.quantity).toFixed(2)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  `}).join('');

  document.querySelectorAll('.btn-toggle-details').forEach(b => b.onclick = () => document.getElementById(`details-${b.dataset.id}`).classList.toggle('open'));
  document.querySelectorAll('.btn-return').forEach(b => b.onclick = () => solicitarDevolucion(parseInt(b.dataset.id)));
}

function solicitarDevolucion(orderId) {
  const reason = prompt('Motivo de la devolución:');
  if (!reason) return;
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'devuelto';
    localStorage.setItem('solOrders', JSON.stringify(orders));
    const returns = JSON.parse(localStorage.getItem('solReturns') || '[]');
    returns.push({ id: Date.now(), orderId, reason, date: new Date().toLocaleString() });
    localStorage.setItem('solReturns', JSON.stringify(returns));
    alert('Tu solicitud de devolución ha sido enviada al equipo de Sol-Manager. Será procesada pronto.');
    renderOrders();
  }
}

// ===== CONFIGURACIÓN (ahora guarda todo de verdad) =====
function initConfig() {
  // Cargar datos actuales en el formulario
  if (configElements.configName) configElements.configName.value = config.name || '';
  if (configElements.configPhone) configElements.configPhone.value = config.phone || '';
  if (configElements.configAddress) configElements.configAddress.value = config.address || '';
  if (configElements.configNotifOffers) configElements.configNotifOffers.checked = config.notifOffers !== false;
  if (configElements.configNotifOrders) configElements.configNotifOrders.checked = config.notifOrders !== false;

  // Guardar perfil
  configElements.btnSaveProfile?.addEventListener('click', () => {
    config.name = configElements.configName.value.trim();
    config.phone = configElements.configPhone.value.trim();
    config.address = configElements.configAddress.value.trim();
    localStorage.setItem('solConfig', JSON.stringify(config));
    alert('Perfil guardado correctamente.');
  });

  // Cambiar contraseña (simulación que guarda en localStorage para demo)
  configElements.btnChangePassword?.addEventListener('click', () => {
    const current = configElements.configCurrentPassword.value;
    const newPass = configElements.configNewPassword.value;
    const confirm = configElements.configConfirmPassword.value;
    if (!current || !newPass || !confirm) {
      alert('Complete todos los campos.');
      return;
    }
    if (newPass !== confirm) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    // Simular almacenamiento de la nueva contraseña (en producción debe usar API)
    localStorage.setItem('solUserPassword', newPass);
    alert('Contraseña cambiada correctamente.');
    configElements.configCurrentPassword.value = '';
    configElements.configNewPassword.value = '';
    configElements.configConfirmPassword.value = '';
    if (document.getElementById('configPasswordMsg')) {
      document.getElementById('configPasswordMsg').textContent = 'Contraseña actualizada.';
    }
  });

  // Guardar preferencias de notificación
  configElements.btnSaveNotifications?.addEventListener('click', () => {
    config.notifOffers = configElements.configNotifOffers.checked;
    config.notifOrders = configElements.configNotifOrders.checked;
    localStorage.setItem('solConfig', JSON.stringify(config));
    alert('Preferencias guardadas.');
  });
}

export function getProductList() { return allProducts; }