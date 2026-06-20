// modules/cajero.js - Funcionalidades del cajero (punto de venta)
import { getProducts, apiFetch } from '../utils/api.js';

let allProducts = [];
let cart = [];
let elements = {};

export function initCajero(refs) {
  elements = {
    posProductSearch: refs.posProductSearch,
    posProductList: refs.posProductList,
    posCartBody: refs.posCartBody,
    posTotalUSD: refs.posTotalUSD,
    posTotalVES: refs.posTotalVES,
    btnAddToCartPOS: refs.btnAddToCartPOS,
    btnCheckoutPOS: refs.btnCheckoutPOS,
    posOrdersContainer: refs.posOrdersContainer,
    posPaymentMethod: refs.posPaymentMethod,
    posCashReceived: refs.posCashReceived,
    posChangeDue: refs.posChangeDue
  };

  // Cargar productos al iniciar
  loadProductsForPOS();
  // Evento de búsqueda
  if (elements.posProductSearch) {
    elements.posProductSearch.addEventListener('input', filterPOSProducts);
  }
  // Evento checkout
  if (elements.btnCheckoutPOS) {
    elements.btnCheckoutPOS.addEventListener('click', processPOSCheckout);
  }

  renderPOSCart();
  loadPOSOrders();
}

async function loadProductsForPOS() {
  try {
    allProducts = await getProducts();
    renderPOSProductList(allProducts);
  } catch (e) {
    console.error(e);
  }
}

function filterPOSProducts() {
  const text = elements.posProductSearch.value.trim().toLowerCase();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(text));
  renderPOSProductList(filtered);
}

function renderPOSProductList(products) {
  if (!elements.posProductList) return;
  elements.posProductList.innerHTML = products.map(p => `
    <div class="pos-product-item" data-id="${p.id}">
      <span>${p.name}</span>
      <span>$${parseFloat(p.price_usd||0).toFixed(2)}</span>
      <button class="btn-pos-add" data-id="${p.id}">+</button>
    </div>
  `).join('');

  // Eventos para agregar al carrito del POS
  elements.posProductList.querySelectorAll('.btn-pos-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const product = allProducts.find(p => p.id === id);
      if (product) {
        addToPOSCart(product);
      }
    });
  });
}

function addToPOSCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  renderPOSCart();
}

function removeFromPOSCart(id) {
  cart = cart.filter(item => item.id !== id);
  renderPOSCart();
}

function updatePOSQuantity(id, delta) {
  const item = cart.find(p => p.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromPOSCart(id);
    return;
  }
  renderPOSCart();
}

function renderPOSCart() {
  if (!elements.posCartBody) return;
  if (!cart.length) {
    elements.posCartBody.innerHTML = '<tr><td colspan="5">No hay productos en la orden</td></tr>';
    updatePOSTotals();
    return;
  }
  elements.posCartBody.innerHTML = cart.map(item => {
    const subtotalUSD = parseFloat(item.price_usd || 0) * item.quantity;
    return `
    <tr>
      <td>${item.name}</td>
      <td>$${parseFloat(item.price_usd||0).toFixed(2)}</td>
      <td>
        <button class="qty-btn-pos" data-id="${item.id}" data-delta="-1">-</button>
        ${item.quantity}
        <button class="qty-btn-pos" data-id="${item.id}" data-delta="1">+</button>
      </td>
      <td>$${subtotalUSD.toFixed(2)}</td>
      <td><button class="btn-remove-pos" data-id="${item.id}">🗑️</button></td>
    </tr>
  `}).join('');

  document.querySelectorAll('.qty-btn-pos').forEach(btn => {
    btn.addEventListener('click', () => updatePOSQuantity(parseInt(btn.dataset.id), parseInt(btn.dataset.delta)));
  });
  document.querySelectorAll('.btn-remove-pos').forEach(btn => {
    btn.addEventListener('click', () => removeFromPOSCart(parseInt(btn.dataset.id)));
  });

  updatePOSTotals();
}

function updatePOSTotals() {
  const totalUSD = cart.reduce((sum, item) => sum + parseFloat(item.price_usd || 0) * item.quantity, 0);
  const totalVES = cart.reduce((sum, item) => sum + parseFloat(item.price_ves || 0) * item.quantity, 0);
  if (elements.posTotalUSD) elements.posTotalUSD.textContent = `$${totalUSD.toFixed(2)}`;
  if (elements.posTotalVES) elements.posTotalVES.textContent = `Bs. ${totalVES.toFixed(2)}`;
}

async function processPOSCheckout() {
  if (!cart.length) { alert('Agrega productos a la orden.'); return; }
  const totalUSD = cart.reduce((s, i) => s + parseFloat(i.price_usd || 0) * i.quantity, 0);
  const totalVES = cart.reduce((s, i) => s + parseFloat(i.price_ves || 0) * i.quantity, 0);
  const metodo = elements.posPaymentMethod?.value || 'efectivo';

  // Simular pago y crear pedido
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    totalUSD,
    totalVES,
    status: 'pagado',
    metodoEntrega: 'recogida',
    direccion: 'En tienda',
    items: cart.map(i => ({ name: i.name, quantity: i.quantity, priceUSD: parseFloat(i.price_usd||0), priceVES: parseFloat(i.price_ves||0) }))
  };
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  orders.push(order);
  localStorage.setItem('solOrders', JSON.stringify(orders));

  // Pago simulado
  const paymentPayload = {
    id_pedido: order.id,
    monto_ves: totalVES,
    monto_usd: totalUSD,
    monto_eur: 0,
    tasa_usd_ves_usada: 590,
    tasa_eur_ves_usada: 690,
    id_cajero: window.currentUserId || 0
  };
  try {
    await apiFetch('/payments', { method: 'POST', body: JSON.stringify(paymentPayload) });
  } catch (e) {
    const offlinePayments = JSON.parse(localStorage.getItem('offlinePayments') || '[]');
    offlinePayments.push(paymentPayload);
    localStorage.setItem('offlinePayments', JSON.stringify(offlinePayments));
  }

  // Calcular cambio si es efectivo
  if (metodo === 'efectivo' && elements.posCashReceived) {
    const recibido = parseFloat(elements.posCashReceived.value) || 0;
    const cambio = recibido - totalVES;
    if (elements.posChangeDue) elements.posChangeDue.textContent = cambio > 0 ? `Bs. ${cambio.toFixed(2)}` : 'Bs. 0.00';
  }

  // Limpiar carrito
  cart = [];
  renderPOSCart();
  loadPOSOrders();
  alert('✅ Venta registrada.');
}

async function loadPOSOrders() {
  if (!elements.posOrdersContainer) return;
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  const recent = orders.slice(-10).reverse();
  if (!recent.length) {
    elements.posOrdersContainer.innerHTML = '<p>No hay pedidos recientes.</p>';
    return;
  }
  elements.posOrdersContainer.innerHTML = recent.map(o => `
    <div class="order-card" style="margin-bottom:0.5rem;">
      <strong>#${o.id}</strong> - ${o.date}<br>
      Total: $${o.totalUSD.toFixed(2)} | Estado: ${o.status}
    </div>
  `).join('');
}