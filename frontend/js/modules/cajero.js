export function init(api, user) {
  const posProductSearch = document.getElementById('posProductSearch');
  const posProductList = document.getElementById('posProductList');
  const posCartBody = document.getElementById('posCartBody');
  const posTotalUSD = document.getElementById('posTotalUSD');
  const posTotalVES = document.getElementById('posTotalVES');
  const btnCheckoutPOS = document.getElementById('btnCheckoutPOS');
  const posPaymentMethod = document.getElementById('posPaymentMethod');
  const posCashReceived = document.getElementById('posCashReceived');
  const posChangeDue = document.getElementById('posChangeDue');
  const posOrdersContainer = document.getElementById('posOrdersContainer');

  let posCart = [];
  let allProducts = [];

  // Cargar todos los productos
  (async () => {
    try { allProducts = await api.get('/productos'); } catch (e) { console.error(e); }
  })();

  // Búsqueda de productos
  posProductSearch.addEventListener('input', () => {
    const term = posProductSearch.value.toLowerCase();
    const filtrados = allProducts.filter(p => p.nombre.toLowerCase().includes(term));
    posProductList.innerHTML = filtrados.map(p => `
      <div class="pos-product-item">
        <span>${p.nombre} – $${parseFloat(p.precio_usd).toFixed(2)}</span>
        <button class="btn-pos-add" data-id="${p.id}">+</button>
      </div>
    `).join('');
    document.querySelectorAll('.btn-pos-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const prod = allProducts.find(p => p.id === id);
        if (prod) addToPosCart(prod);
      });
    });
  });

  function addToPosCart(producto) {
    const existente = posCart.find(item => item.producto_id === producto.id);
    if (existente) existente.cantidad += 1;
    else posCart.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_bs: parseFloat(producto.precio_bs),
      precio_usd: parseFloat(producto.precio_usd),
      cantidad: 1,
      unidad_id: producto.unidad_medida_base_id
    });
    renderPosCart();
  }

  function removeFromPosCart(index) { posCart.splice(index, 1); renderPosCart(); }

  function renderPosCart() {
    posCartBody.innerHTML = posCart.map((item, idx) => `
      <tr>
        <td>${item.nombre}</td>
        <td>$${item.precio_usd.toFixed(2)}</td>
        <td>${item.cantidad}</td>
        <td>$${(item.precio_usd * item.cantidad).toFixed(2)}</td>
        <td><button class="cart-remove" data-idx="${idx}">🗑️</button></td>
      </tr>
    `).join('');

    const totalUSD = posCart.reduce((sum, i) => sum + i.precio_usd * i.cantidad, 0);
    const totalBS = posCart.reduce((sum, i) => sum + i.precio_bs * i.cantidad, 0);
    posTotalUSD.textContent = `$${totalUSD.toFixed(2)}`;
    posTotalVES.textContent = `Bs. ${totalBS.toFixed(2)}`;

    if (posPaymentMethod.value === 'efectivo' && posCashReceived.value) {
      const recibido = parseFloat(posCashReceived.value) || 0;
      const cambio = recibido - totalBS;
      posChangeDue.textContent = `Bs. ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}`;
    }

    document.querySelectorAll('#posCartBody .cart-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        removeFromPosCart(idx);
      });
    });
  }

  posPaymentMethod.addEventListener('change', () => {
    document.getElementById('posCashSection').style.display = posPaymentMethod.value === 'efectivo' ? 'block' : 'none';
    renderPosCart();
  });
  posCashReceived.addEventListener('input', renderPosCart);

  // Venta rápida
  btnCheckoutPOS.addEventListener('click', async () => {
    if (posCart.length === 0) return alert('Agregue productos');
    const metodo = posPaymentMethod.value;
    try {
      await api.post('/cajero/venta', {
        items: posCart.map(i => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          unidad_id: i.unidad_id
        })),
        metodo_pago: metodo,
        datos_pago: {}
      });
      posCart = [];
      renderPosCart();
      alert('Venta realizada');
      loadDayOrders();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  });

  // Caja
  document.getElementById('btnOpenCashier')?.addEventListener('click', async () => {
    const inicialBS = document.getElementById('cashierOpeningVES').value;
    const inicialUSD = document.getElementById('cashierOpeningUSD').value;
    if (!inicialBS || !inicialUSD) return alert('Ingrese montos iniciales');
    try {
      const res = await api.post('/cajero/abrir-caja', { inicial_bs: parseFloat(inicialBS), inicial_usd: parseFloat(inicialUSD) });
      document.getElementById('cashierStatus').textContent = 'Caja abierta – ID: ' + res.id;
    } catch (e) { alert(e.message); }
  });

  document.getElementById('btnCloseCashier')?.addEventListener('click', async () => {
    const finalBS = prompt('Monto final en Bs.:');
    const finalUSD = prompt('Monto final en USD:');
    if (!finalBS || !finalUSD) return;
    // Obtener la caja abierta (necesitaríamos un endpoint /cajero/caja-abierta, asumimos el ID guardado)
    // Simplificamos: usar un ID fijo o pedirlo. Por ahora usaremos un prompt para el ID de caja.
    const cajaId = prompt('ID de la caja abierta:');
    try {
      await api.post('/cajero/cerrar-caja', {
        caja_id: cajaId,
        final_bs: parseFloat(finalBS),
        final_usd: parseFloat(finalUSD),
        comentario: 'Cierre manual'
      });
      document.getElementById('cashierStatus').textContent = 'Caja cerrada';
    } catch (e) { alert(e.message); }
  });

  // Pedidos del día
  async function loadDayOrders() {
    try {
      const pedidos = await api.get('/cajero/pedidos-dia');
      if (posOrdersContainer) {
        posOrdersContainer.innerHTML = pedidos.map(p => `
          <div class="order-card">
            <div class="order-header">
              <span>Pedido #${p.id.substring(0,8)}</span>
              <span>${p.estado || ''} - $${p.total_usd}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) { console.error(e); }
  }
  loadDayOrders();
}