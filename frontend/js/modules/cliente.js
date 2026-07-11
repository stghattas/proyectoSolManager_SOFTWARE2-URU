// cliente.js – Módulo completo para el rol cliente

export function init(api, user) {
  // ===== RENDERIZAR GRILLA DE PRODUCTOS =====
  function renderProductGrid(container, productos) {
    container.innerHTML = productos.map(p => {
      let emoji = '📦';
      if (p.imagen_url && p.imagen_url.length <= 4) emoji = p.imagen_url;
      else if (p.imagen_url && p.imagen_url.includes('emojicdn')) {
        const parts = p.imagen_url.split('/');
        emoji = decodeURIComponent(parts[parts.length - 1]);
      }
      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-emoji">${emoji}</div>
          <div class="product-info">
            <h3 class="product-name">${p.nombre}</h3>
            <p class="product-unit">${p.unidad_abreviatura || 'ud'}</p>
            <div class="product-prices">
              <span class="price-usd">$${parseFloat(p.precio_usd).toFixed(2)}</span>
              <span class="price-bs">Bs.${parseFloat(p.precio_bs).toFixed(2)}</span>
            </div>
            <button class="btn-add-cart" data-id="${p.id}">Agregar al carrito</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = btn.dataset.id;
        const producto = productos.find(p => p.id === prodId);
        if (producto) addToCart(producto);
      });
    });
  }

  // ===== CARRITO =====
  let cart = JSON.parse(localStorage.getItem('sol_cart') || '[]');
  function saveCart() { localStorage.setItem('sol_cart', JSON.stringify(cart)); renderCart(); }

  function addToCart(producto, cantidad = 1) {
    const existente = cart.find(item => item.producto_id === producto.id);
    if (existente) existente.cantidad += cantidad;
    else cart.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_bs: parseFloat(producto.precio_bs),
      precio_usd: parseFloat(producto.precio_usd),
      unidad_id: producto.unidad_medida_base_id || producto.unidad_abreviatura,
      cantidad
    });
    saveCart();
    alert(`${producto.nombre} añadido al carrito`);
  }

  function removeFromCart(index) { cart.splice(index, 1); saveCart(); }
  function updateCartItem(index, newQty) { if (newQty <= 0) removeFromCart(index); else { cart[index].cantidad = newQty; saveCart(); } }

  function renderCart() {
    const tbody = document.getElementById('cartTableBody');
    if (!tbody) return;
    if (cart.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No hay productos en el carrito</td></tr>';
    } else {
      tbody.innerHTML = cart.map((item, idx) => `
        <tr>
          <td>${item.nombre}</td>
          <td>$${item.precio_usd.toFixed(2)} / Bs.${item.precio_bs.toFixed(2)}</td>
          <td><input type="number" value="${item.cantidad}" min="1" class="cart-qty" data-idx="${idx}"></td>
          <td>$${(item.precio_usd * item.cantidad).toFixed(2)}</td>
          <td><button class="cart-remove" data-idx="${idx}">🗑️</button></td>
        </tr>
      `).join('');
    }
    const subtotalUSD = cart.reduce((sum, i) => sum + i.precio_usd * i.cantidad, 0);
    const subtotalBS = cart.reduce((sum, i) => sum + i.precio_bs * i.cantidad, 0);
    document.getElementById('summarySubtotal').textContent = `$${subtotalUSD.toFixed(2)}`;
    document.getElementById('summaryTotalUSD').textContent = `$${subtotalUSD.toFixed(2)}`;
    document.getElementById('summaryTotalVES').textContent = `Bs. ${subtotalBS.toFixed(2)}`;

    document.querySelectorAll('.cart-qty').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        updateCartItem(idx, parseInt(e.target.value) || 1);
      });
    });
    document.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        removeFromCart(idx);
      });
    });
  }

  // ===== PRODUCTOS INICIO =====
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

  // ===== BÚSQUEDA EN INICIO =====
  const searchInput = document.getElementById('searchInput');
  const btnSearch = document.getElementById('btnSearch');
  function filterHomeProducts(term) {
    const container = document.getElementById('productGridContainer');
    if (!container) return;
    const cards = container.querySelectorAll('.product-card');
    const t = term.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.querySelector('.product-name').textContent.toLowerCase();
      card.style.display = name.includes(t) ? '' : 'none';
    });
  }
  btnSearch?.addEventListener('click', () => filterHomeProducts(searchInput.value));
  searchInput?.addEventListener('input', () => filterHomeProducts(searchInput.value));

  // ===== CATÁLOGO =====
  async function loadCatalogProducts(filtro = {}) {
    const grid = document.getElementById('catalogProductGrid');
    if (!grid) return;
    let url = '/productos?';
    if (filtro.categoria) url += `categoria=${filtro.categoria}&`;
    if (filtro.buscar) url += `buscar=${encodeURIComponent(filtro.buscar)}&`;
    try {
      const productos = await api.get(url);
      renderProductGrid(grid, productos);
      document.getElementById('catalogCount').textContent = `${productos.length} productos`;
    } catch (err) {
      grid.innerHTML = `<p class="error">Error al cargar catálogo</p>`;
    }
  }

  document.getElementById('catalogSearch')?.addEventListener('input', (e) => {
    const catId = document.querySelector('.category-card.active')?.dataset.catId;
    loadCatalogProducts({ categoria: catId, buscar: e.target.value.trim() });
  });

  // ===== CHECKOUT =====
  let lastOrderId = null;

  document.getElementById('btnCheckout')?.addEventListener('click', () => {
    if (cart.length === 0) return alert('El carrito está vacío');
    document.getElementById('paymentModal').style.display = 'flex';
    document.getElementById('paymentMethodSelect').value = '';
    document.querySelectorAll('[id$="Fields"]').forEach(d => d.style.display = 'none');
    document.getElementById('paymentFormFields').style.display = 'block';
    document.getElementById('paymentSuccessView').style.display = 'none';
  });

  document.getElementById('paymentMethodSelect')?.addEventListener('change', function() {
    const m = this.value;
    document.getElementById('pagoMovilFields').style.display = m === 'pago_movil' ? 'block' : 'none';
    document.getElementById('transferenciaFields').style.display = m === 'transferencia' ? 'block' : 'none';
    document.getElementById('tarjetaFields').style.display = m === 'tarjeta' ? 'block' : 'none';
  });

  document.getElementById('btnConfirmPayment')?.addEventListener('click', async () => {
    const method = document.getElementById('paymentMethodSelect').value;
    if (!method) return alert('Selecciona método de pago');
    try {
      const res = await api.post('/pedidos', {
        metodo_pago: method,
        datos_pago: {},
        items: cart.map(i => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          unidad_id: i.unidad_id
        }))
      });
      lastOrderId = res.id;
      cart = [];
      saveCart();
      document.getElementById('paymentFormFields').style.display = 'none';
      document.getElementById('paymentSuccessView').style.display = 'block';
    } catch (err) {
      alert('Error al crear pedido: ' + err.message);
    }
  });

  // Descargar factura
  document.getElementById('btnDownloadInvoice')?.addEventListener('click', async () => {
  if (!lastOrderId) return alert('No hay pedido reciente');
  try {
    const pedido = await api.get(`/pedidos/${lastOrderId}/factura`);
    const invoiceDiv = document.getElementById('invoicePrintable');
    const content = document.getElementById('invoiceContent');
    
    // Construir HTML de la factura
    content.innerHTML = `
      <h2 style="text-align:center;">Sol Manager - Factura</h2>
      <p><strong>Pedido #${pedido.id.substring(0,8)}</strong></p>
      <p>Fecha: ${new Date(pedido.fecha_pedido).toLocaleString()}</p>
      <p>Cliente: ${user.nombre}</p>
      <hr>
      <table style="width:100%; border-collapse:collapse;">
        <tr style="background:#f0f0f0;"><th>Producto</th><th>Cant.</th><th>Precio USD</th><th>Subtotal USD</th></tr>
        ${pedido.items.map(it => `
          <tr>
            <td>${it.producto_nombre}</td>
            <td>${it.cantidad}</td>
            <td>$${parseFloat(it.precio_unitario_usd).toFixed(2)}</td>
            <td>$${parseFloat(it.subtotal_usd).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <hr>
      <p><strong>Total USD:</strong> $${parseFloat(pedido.total_usd).toFixed(2)}</p>
      <p><strong>Total Bs:</strong> Bs.${parseFloat(pedido.total_bs).toFixed(2)}</p>
      <p style="text-align:center; color:gray;">Gracias por su compra</p>
    `;
    
    // Mostrar temporalmente para capturar con html2canvas
    invoiceDiv.style.display = 'block';
    invoiceDiv.style.position = 'absolute';
    invoiceDiv.style.left = '-9999px'; // fuera de pantalla pero visible para el render
    
    // Esperar un poco a que se renderice
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(invoiceDiv, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    // Ocultar de nuevo
    invoiceDiv.style.display = 'none';
    invoiceDiv.style.position = '';
    invoiceDiv.style.left = '';
    
    // Descargar la imagen
    const link = document.createElement('a');
    link.download = `factura_${pedido.id.substring(0,8)}.png`;
    link.href = imgData;
    link.click();
    
  } catch (e) {
    alert('Error al generar factura: ' + e.message);
  }
});

  // Cerrar modal de pago
  document.getElementById('closePaymentModal')?.addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
  });
  document.getElementById('btnClosePayment')?.addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
  });

  // ===== HISTORIAL DE PEDIDOS =====
  async function loadOrders(estado = 'pendiente') {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    try {
      const pedidos = await api.get(`/pedidos?estado=${estado}`);
      container.innerHTML = pedidos.map(p => `
        <div class="order-card">
          <div class="order-header">
            <span>Pedido #${p.id.substring(0,8)}</span>
            <span class="order-status ${p.estado}">${p.estado}</span>
          </div>
          <div>Fecha: ${new Date(p.fecha_pedido).toLocaleString()}</div>
          <div>Total: $${p.total_usd} / Bs.${p.total_bs}</div>
        </div>
      `).join('') || '<p>No hay pedidos</p>';
    } catch (err) {
      container.innerHTML = `<p class="error">Error al cargar pedidos</p>`;
    }
  }
  document.getElementById('ordersFilter')?.addEventListener('change', (e) => loadOrders(e.target.value));

  // ===== CONFIGURACIÓN =====
  async function loadProfile() {
    try {
      const perfil = await api.get('/auth/perfil');
      document.getElementById('configName').value = perfil.nombre || '';
      // Cargar teléfono si existe
      document.getElementById('configPhone').value = perfil.telefono || '';
      // Dirección no se guarda en usuario, se omite por ahora
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById('btnSaveProfile')?.addEventListener('click', async () => {
    const nombre = document.getElementById('configName').value.trim();
    const telefono = document.getElementById('configPhone').value.trim();
    try {
      await api.put('/auth/perfil', { nombre, telefono });
      alert('Perfil actualizado correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  document.getElementById('btnChangePassword')?.addEventListener('click', async () => {
  const current = document.getElementById('configCurrentPassword').value;
  const newPass = document.getElementById('configNewPassword').value;
  const confirm = document.getElementById('configConfirmPassword').value;
  const msg = document.getElementById('configPasswordMsg');
  if (!current || !newPass || !confirm) {
    msg.textContent = 'Todos los campos son obligatorios';
    return;
  }
  if (newPass !== confirm) {
    msg.textContent = 'Las contraseñas no coinciden';
    return;
  }
  try {
    await api.put('/auth/cambiar-password', { password_actual: current, password_nueva: newPass });
    msg.textContent = 'Contraseña cambiada exitosamente';
    msg.style.color = 'green';
    // Limpiar campos
    document.getElementById('configCurrentPassword').value = '';
    document.getElementById('configNewPassword').value = '';
    document.getElementById('configConfirmPassword').value = '';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = 'red';
  }
});

  document.getElementById('btnSaveNotifications')?.addEventListener('click', () => {
    alert('Preferencias guardadas (simulación)');
  });

  // ===== CONTROL DE VISTAS =====
  window.addEventListener('hashchange', () => {
    const viewId = window.location.hash.substring(1);
    if (viewId === 'view-home') loadHomeProducts();
    else if (viewId === 'view-catalog') loadCatalogProducts();
    else if (viewId === 'view-cart') renderCart();
    else if (viewId === 'view-orders') loadOrders();
    else if (viewId === 'view-config') loadProfile();
  });

  // Carga inicial
  loadHomeProducts();
  if (window.location.hash.substring(1) === 'view-config') loadProfile();
}