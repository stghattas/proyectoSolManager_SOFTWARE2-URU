// cliente.js – Módulo completo para el rol Cliente (actualizado con devoluciones)
import wsClient from '../wsClient.js';

export function init(api, user) {
  // ========== CONEXIÓN WEBSOCKET (para chat) ==========
  wsClient.connect(api.getToken());

  wsClient.on('chat', (msg) => {
    const modal = document.getElementById('chatModal');
    if (!modal || modal.style.display !== 'flex') return;
    const input = document.getElementById('chatMessageInput');
    if (!input || input.dataset.pedidoId !== msg.pedidoId) return;
    const chatDiv = document.getElementById('chatMessages');
    if (chatDiv) {
      chatDiv.innerHTML += `
        <div class="chat-message ${msg.from === user.id ? 'mine' : 'other'}">
          <div class="chat-bubble ${msg.from === user.id ? 'mine' : ''}">
            <strong>${msg.nombre}:</strong> ${msg.text}
          </div>
        </div>`;
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  });

  // ========== RENDERIZAR GRILLA DE PRODUCTOS ==========
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

  // ========== CARRITO ==========
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

  // ========== PRODUCTOS INICIO ==========
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

  // ========== BÚSQUEDA EN INICIO (solo al hacer clic o Enter) ==========
  const searchInput = document.getElementById('searchInput');
  const btnSearch = document.getElementById('btnSearch');
  function filterHomeProducts(term) {
    const container = document.getElementById('productGridContainer');
    if (!container) return;
    const cards = container.querySelectorAll('.product-card');
    const t = term.toLowerCase().trim();
    cards.forEach(card => {
      const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
      card.style.display = name.includes(t) ? '' : 'none';
    });
  }
  btnSearch?.addEventListener('click', () => filterHomeProducts(searchInput.value));
  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterHomeProducts(searchInput.value);
  });

  // ========== CATÁLOGO (ordenar + categorías) ==========
  async function loadCatalogProducts(filtro = {}) {
    const grid = document.getElementById('catalogProductGrid');
    const countSpan = document.getElementById('catalogCount');
    if (!grid) return;
    try {
      let url = '/productos?';
      if (filtro.categoria) url += `categoria=${filtro.categoria}&`;
      if (filtro.buscar) url += `buscar=${encodeURIComponent(filtro.buscar)}&`;
      let productos = await api.get(url);

      const sortBy = document.getElementById('catalogSort')?.value || 'name-asc';
      switch (sortBy) {
        case 'name-asc': productos.sort((a,b) => a.nombre.localeCompare(b.nombre)); break;
        case 'name-desc': productos.sort((a,b) => b.nombre.localeCompare(a.nombre)); break;
        case 'price-asc': productos.sort((a,b) => parseFloat(a.precio_usd) - parseFloat(b.precio_usd)); break;
        case 'price-desc': productos.sort((a,b) => parseFloat(b.precio_usd) - parseFloat(a.precio_usd)); break;
      }

      renderProductGrid(grid, productos);
      if (countSpan) countSpan.textContent = `${productos.length} productos`;
    } catch (err) {
      grid.innerHTML = `<p class="error">Error al cargar catálogo</p>`;
    }
  }

  document.getElementById('catalogSort')?.addEventListener('change', () => {
    const activeCat = document.querySelector('.category-card.active')?.dataset.catId || null;
    const search = document.getElementById('catalogSearch')?.value.trim() || '';
    loadCatalogProducts({ categoria: activeCat, buscar: search });
  });

  // ========== CHECKOUT Y FACTURA ==========
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
        direccion_entrega_id: document.getElementById('paymentAddress').dataset.id || null,
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

  document.getElementById('btnDownloadInvoice')?.addEventListener('click', async () => {
    if (!lastOrderId) return;
    try {
      const pedido = await api.get(`/pedidos/${lastOrderId}/factura`);
      const invoiceDiv = document.getElementById('invoicePrintable');
      const content = document.getElementById('invoiceContent');
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
        <p style="text-align:center;">Gracias por su compra</p>
      `;
      invoiceDiv.style.display = 'block';
      invoiceDiv.style.position = 'absolute';
      invoiceDiv.style.left = '-9999px';
      const canvas = await html2canvas(invoiceDiv, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      invoiceDiv.style.display = 'none';
      invoiceDiv.style.position = '';
      invoiceDiv.style.left = '';
      const link = document.createElement('a');
      link.download = `factura_${pedido.id.substring(0,8)}.png`;
      link.href = imgData;
      link.click();
    } catch (e) {
      alert('Error al generar factura: ' + e.message);
    }
  });

  document.getElementById('closePaymentModal')?.addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
  });
  document.getElementById('btnClosePayment')?.addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
  });

  // ========== HISTORIAL DE PEDIDOS + SOLICITAR DEVOLUCIÓN ==========
  async function loadOrders(estado = 'pendiente') {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    try {
      const pedidos = await api.get(`/pedidos?estado=${estado}`);
      if (!pedidos.length) {
        container.innerHTML = '<p>No hay pedidos</p>';
        return;
      }

      container.innerHTML = pedidos.map(p => {
        // Solo se puede solicitar devolución si está entregado
        const devBtn = p.estado === 'entregado'
          ? `<button class="btn-request-return" data-pedido-id="${p.id}" style="margin-top:0.5rem; background:var(--color-primary); color:#422006; border:none; padding:0.3rem 0.8rem; border-radius:4px;">Solicitar devolución</button>`
          : '';

        return `
          <div class="order-card">
            <div class="order-header">
              <span>Pedido #${p.id.substring(0,8)}</span>
              <span class="order-status ${p.estado}">${p.estado}</span>
            </div>
            <div>Fecha: ${new Date(p.fecha_pedido).toLocaleString()}</div>
            <div>Total: $${p.total_usd} / Bs.${p.total_bs}</div>
            ${devBtn}
          </div>
        `;
      }).join('');

      // Evento para solicitar devolución
      container.querySelectorAll('.btn-request-return').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pedidoId = btn.dataset.pedidoId;
          const pedido = await api.get(`/pedidos/${pedidoId}`);
          if (!pedido || !pedido.items) return;

          // Construir modal dinámico
          let modalHtml = `
            <div class="modal-overlay" id="returnModal">
              <div class="modal-box">
                <span class="close-modal" id="closeReturnModal">&times;</span>
                <h2>Solicitar devolución</h2>
                <div class="form-group">
                  <label>Motivo de devolución</label>
                  <textarea id="returnMotivo" rows="3" style="width:100%; padding:0.5rem;"></textarea>
                </div>
                <p>Productos del pedido:</p>
                <div id="returnItemsList">
                  ${pedido.items.map(item => `
                    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:0.5rem;">
                      <input type="checkbox" class="return-item-check" data-item-id="${item.id}" checked>
                      <span>${item.producto_nombre} (máx ${item.cantidad})</span>
                      <input type="number" class="return-cantidad" value="${item.cantidad}" min="1" max="${item.cantidad}" style="width:70px;">
                    </div>
                  `).join('')}
                </div>
                <button id="submitReturnBtn" class="btn-checkout" style="margin-top:1rem;">Enviar solicitud</button>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML('beforeend', modalHtml);
          const modal = document.getElementById('returnModal');
          modal.style.display = 'flex';

          document.getElementById('closeReturnModal').addEventListener('click', () => modal.remove());
          document.getElementById('submitReturnBtn').addEventListener('click', async () => {
            const motivo = document.getElementById('returnMotivo').value.trim();
            if (!motivo) return alert('Escribe un motivo');

            const items = [];
            document.querySelectorAll('.return-item-check:checked').forEach(cb => {
              const itemId = cb.dataset.itemId;
              const cant = parseInt(cb.parentElement.querySelector('.return-cantidad').value);
              if (cant > 0) items.push({ pedido_item_id: itemId, cantidad: cant });
            });
            if (items.length === 0) return alert('Selecciona al menos un producto');

            try {
              await api.post('/devoluciones/devolucion', {
                pedido_id: pedidoId,
                motivo,
                items
              });
              alert('Solicitud de devolución enviada.');
              modal.remove();
              loadOrders(estado);
            } catch (err) {
              alert('Error: ' + err.message);
            }
          });
        });
      });
    } catch (err) {
      container.innerHTML = `<p class="error">Error al cargar pedidos</p>`;
    }
  }

  // ========== MIS DEVOLUCIONES (nueva pestaña) ==========
  async function loadMyReturns() {
    const container = document.getElementById('returnsContainer');
    if (!container) return;
    try {
      const devoluciones = await api.get('/devoluciones/devoluciones');
      if (devoluciones.length === 0) {
        container.innerHTML = '<p>No tienes solicitudes de devolución</p>';
        return;
      }
      container.innerHTML = devoluciones.map(d => `
        <div class="order-card">
          <div class="order-header">
            <span>Devolución #${d.id.substring(0,8)}</span>
            <span class="order-status ${d.estado}">${d.estado}</span>
          </div>
          <div><strong>Pedido:</strong> ${d.pedido_id.substring(0,8)}</div>
          <div><strong>Motivo:</strong> ${d.motivo}</div>
          <div><strong>Comentario gerente:</strong> ${d.comentario_gerente || 'Pendiente'}</div>
          <div><strong>Productos:</strong> ${d.items?.map(i => `${i.producto_nombre} x${i.cantidad}`).join(', ') || 'N/A'}</div>
          <div><strong>Fecha solicitud:</strong> ${new Date(d.fecha_solicitud).toLocaleString()}</div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="error">Error al cargar devoluciones</p>`;
    }
  }

  // ========== SEGUIMIENTO DELIVERY + CHAT ==========
  let currentTrackingPedidoId = null;

  async function loadActiveDelivery() {
    const statusEl = document.getElementById('deliveryStatus');
    const etaEl = document.getElementById('deliveryETA');
    const courierEl = document.getElementById('deliveryCourier');
    const openChatBtn = document.getElementById('openChatFromDelivery');

    if (!statusEl) return;
    try {
      const data = await api.get('/pedidos/activo/seguimiento');
      if (data) {
        statusEl.textContent = data.estado;
        etaEl.textContent = data.tiempo_estimado_minutos ? `${data.tiempo_estimado_minutos} min` : 'No especificado';
        courierEl.textContent = data.repartidor_nombre || 'Repartidor';
        if (openChatBtn) {
          openChatBtn.style.display = 'inline-block';
          openChatBtn.dataset.repartidorId = data.repartidor_id;
          currentTrackingPedidoId = data.id;
        }
      } else {
        statusEl.textContent = 'No hay entrega activa';
        etaEl.textContent = '-';
        courierEl.textContent = '-';
        if (openChatBtn) openChatBtn.style.display = 'none';
        currentTrackingPedidoId = null;
      }
    } catch (e) { console.error(e); }
  }

  document.getElementById('openChatFromDelivery')?.addEventListener('click', () => {
    const repartidorId = document.getElementById('openChatFromDelivery').dataset.repartidorId;
    if (currentTrackingPedidoId && repartidorId) {
      openChat(currentTrackingPedidoId, repartidorId);
    }
  });

  async function openChat(pedidoId, otroUserId) {
    const modal = document.getElementById('chatModal');
    if (modal) modal.style.display = 'flex';
    const input = document.getElementById('chatMessageInput');
    if (input) {
      input.value = '';
      input.dataset.pedidoId = pedidoId;
      input.dataset.to = otroUserId;
    }
    const chatDiv = document.getElementById('chatMessages');
    if (chatDiv) {
      try {
        const mensajes = await api.get(`/pedidos/${pedidoId}/mensajes`);
        chatDiv.innerHTML = mensajes.map(m => `
          <div class="chat-message ${m.remitente_id === user.id ? 'mine' : 'other'}">
            <div class="chat-bubble ${m.remitente_id === user.id ? 'mine' : ''}">
              <strong>${m.remitente_nombre}:</strong> ${m.mensaje}
            </div>
          </div>
        `).join('');
      } catch (e) { chatDiv.innerHTML = ''; }
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  }

  document.getElementById('btnSendMessage')?.addEventListener('click', () => {
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    const pedidoId = input.dataset.pedidoId;
    const to = input.dataset.to;
    if (text && pedidoId && to) {
      wsClient.send({ type: 'chat', pedidoId, to, text });
      input.value = '';
      const chatDiv = document.getElementById('chatMessages');
      chatDiv.innerHTML += `
        <div class="chat-message mine">
          <div class="chat-bubble mine"><strong>Tú:</strong> ${text}</div>
        </div>`;
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  });

  document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').style.display = 'none';
  });

  // ========== CONFIGURACIÓN ==========
  async function loadProfile() {
    try {
      const perfil = await api.get('/auth/perfil');
      document.getElementById('configName').value = perfil.nombre || '';
      document.getElementById('configPhone').value = perfil.telefono || '';
    } catch (e) { console.error(e); }
  }

  document.getElementById('btnSaveProfile')?.addEventListener('click', async () => {
    const nombre = document.getElementById('configName').value.trim();
    const telefono = document.getElementById('configPhone').value.trim();
    try {
      await api.put('/auth/perfil', { nombre, telefono });
      alert('Perfil actualizado correctamente');
    } catch (err) { alert('Error: ' + err.message); }
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

  // ========== NAVEGACIÓN ==========
  window.addEventListener('hashchange', () => {
    const viewId = window.location.hash.substring(1);
    if (viewId === 'view-home') loadHomeProducts();
    else if (viewId === 'view-catalog') loadCatalogProducts();
    else if (viewId === 'view-cart') renderCart();
    else if (viewId === 'view-orders') loadOrders();
    else if (viewId === 'view-returns') loadMyReturns();
    else if (viewId === 'view-delivery') loadActiveDelivery();
    else if (viewId === 'view-config') loadProfile();
  });

  // Carga inicial según vista actual
  const currentView = window.location.hash.substring(1) || 'view-home';
  if (currentView === 'view-home') loadHomeProducts();
  if (currentView === 'view-catalog') loadCatalogProducts();
  if (currentView === 'view-cart') renderCart();
  if (currentView === 'view-orders') loadOrders();
  if (currentView === 'view-returns') loadMyReturns();
  if (currentView === 'view-delivery') loadActiveDelivery();
  if (currentView === 'view-config') loadProfile();
}