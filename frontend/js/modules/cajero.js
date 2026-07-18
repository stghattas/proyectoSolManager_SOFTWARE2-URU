// cajero.js - Módulo completo para Cajero (POS + Clientes)
export function init(api, user) {
  // ========== ESTADO LOCAL ==========
  let currentCart = [];
  let selectedClient = null;
  let cajaAbierta = false;
  let currentCajaId = null;
  let lastOrderId = null;

  // ========== REFERENCIAS AL DOM (POS) ==========
  const posProductSearch = document.getElementById('posProductSearch');
  const posProductList = document.getElementById('posProductList');
  const posCartBody = document.getElementById('posCartBody');
  const posTotalUSD = document.getElementById('posTotalUSD');
  const posTotalVES = document.getElementById('posTotalVES');
  const posPaymentMethod = document.getElementById('posPaymentMethod');
  const btnCheckoutPOS = document.getElementById('btnCheckoutPOS');
  const btnOpenCashier = document.getElementById('btnOpenCashier');
  const btnCloseCashier = document.getElementById('btnCloseCashier');
  const cashierStatus = document.getElementById('cashierStatus');
  const posClientSearch = document.getElementById('posClientSearch');
  const btnSearchClient = document.getElementById('btnSearchClient');
  const posClientDropdown = document.getElementById('posClientDropdown');
  const posSelectedClient = document.getElementById('posSelectedClient');
  const posClientName = document.getElementById('posClientName');
  const posClientCedula = document.getElementById('posClientCedula');
  const btnClearClient = document.getElementById('btnClearClient');
  const posOrdersContainer = document.getElementById('posOrdersContainer');
  const posInvoiceArea = document.getElementById('posInvoiceArea');
  const btnDownloadPosInvoice = document.getElementById('btnDownloadPosInvoice');

  const paymentFields = {
    pago_movil: document.getElementById('posPagoMovilFields'),
    transferencia: document.getElementById('posTransferenciaFields'),
    tarjeta: document.getElementById('posTarjetaFields'),
  };
  const posCashSection = document.getElementById('posCashSection');

  // ========== FUNCIONES DEL POS (se mantienen igual) ==========
  function updateTotals() {
    const subtotalUSD = currentCart.reduce((sum, item) => sum + item.precio_usd * item.cantidad, 0);
    const subtotalBS = currentCart.reduce((sum, item) => sum + item.precio_bs * item.cantidad, 0);
    posTotalUSD.textContent = `$${subtotalUSD.toFixed(2)}`;
    posTotalVES.textContent = `Bs. ${subtotalBS.toFixed(2)}`;
  }

  function renderCart() {
    if (currentCart.length === 0) {
      posCartBody.innerHTML = '<tr><td colspan="5">No hay productos en la orden</td></tr>';
    } else {
      posCartBody.innerHTML = currentCart.map((item, idx) => `
        <tr>
          <td>${item.nombre}</td>
          <td>$${item.precio_usd.toFixed(2)} / Bs.${item.precio_bs.toFixed(2)}</td>
          <td><input type="number" value="${item.cantidad}" min="1" class="cart-qty" data-idx="${idx}" style="width:60px;"></td>
          <td>$${(item.precio_usd * item.cantidad).toFixed(2)}</td>
          <td><button class="cart-remove" data-idx="${idx}">🗑️</button></td>
        </tr>
      `).join('');
    }
    updateTotals();

    posCartBody.querySelectorAll('.cart-qty').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const newQty = parseInt(e.target.value) || 1;
        currentCart[idx].cantidad = newQty;
        renderCart();
      });
    });
    posCartBody.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        currentCart.splice(idx, 1);
        renderCart();
      });
    });
  }

  async function searchProducts(query) {
    if (!query || query.trim().length === 0) {
      posProductList.innerHTML = '';
      return;
    }
    try {
      const productos = await api.get(`/productos/buscar?q=${encodeURIComponent(query)}`);
      renderProductList(productos);
    } catch (err) {
      posProductList.innerHTML = `<p class="error">Error al buscar</p>`;
    }
  }

  function renderProductList(productos) {
    if (!productos || productos.length === 0) {
      posProductList.innerHTML = '<p>No se encontraron productos</p>';
      return;
    }
    posProductList.innerHTML = productos.map(p => `
      <div class="pos-product-item">
        <span>${p.nombre} (${p.codigo_barras || 'sin código'})</span>
        <span>$${parseFloat(p.precio_usd).toFixed(2)}</span>
        <button class="btn-pos-add" data-id="${p.id}">+</button>
      </div>
    `).join('');

    posProductList.querySelectorAll('.btn-pos-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.dataset.id;
        const prod = productos.find(p => p.id === prodId);
        if (prod) addToCart(prod);
      });
    });
  }

  function addToCart(producto) {
    const existente = currentCart.find(item => item.producto_id === producto.id);
    if (existente) {
      existente.cantidad += 1;
    } else {
      currentCart.push({
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_bs: parseFloat(producto.precio_bs),
        precio_usd: parseFloat(producto.precio_usd),
        unidad_id: producto.unidad_medida_base_id,
        cantidad: 1
      });
    }
    renderCart();
  }

  // ========== CLIENTES (búsqueda y selección en POS) ==========
  async function searchClients(query) {
    try {
      const clientes = await api.get(`/cajero/clientes?buscar=${encodeURIComponent(query)}`);
      posClientDropdown.innerHTML = '';
      if (clientes.length === 0) {
        posClientDropdown.innerHTML = '<div style="padding:0.5rem;">Sin resultados</div>';
      } else {
        clientes.forEach(c => {
          const div = document.createElement('div');
          div.style.padding = '0.5rem';
          div.style.cursor = 'pointer';
          div.style.borderBottom = '1px solid var(--border-color)';
          div.textContent = `${c.nombre} ${c.apellido} - C.I: ${c.cedula || 'N/A'} - Tel: ${c.telefono || ''}`;
          div.addEventListener('click', () => selectClient(c));
          posClientDropdown.appendChild(div);
        });
      }
      posClientDropdown.style.display = 'block';
    } catch (err) {
      console.error(err);
    }
  }

  function selectClient(client) {
    selectedClient = client;
    posClientName.textContent = `${client.nombre} ${client.apellido}`;
    posClientCedula.textContent = client.cedula || '';
    posSelectedClient.style.display = 'block';
    posClientDropdown.style.display = 'none';
    posClientSearch.value = '';
  }

  function clearClient() {
    selectedClient = null;
    posSelectedClient.style.display = 'none';
  }

  // ========== CAJA ==========
  async function openCashier() {
    const ves = parseFloat(document.getElementById('cashierOpeningVES').value) || 0;
    const usd = parseFloat(document.getElementById('cashierOpeningUSD').value) || 0;
    try {
      const caja = await api.post('/cajero/abrir-caja', { inicial_bs: ves, inicial_usd: usd });
      currentCajaId = caja.id;
      cajaAbierta = true;
      cashierStatus.textContent = 'Caja abierta';
      cashierStatus.style.color = 'green';
    } catch (err) {
      alert('Error al abrir caja: ' + err.message);
    }
  }

  async function closeCashier() {
    if (!currentCajaId) return alert('Primero abre la caja');
    const finalBS = parseFloat(document.getElementById('cashierOpeningVES').value) || 0;
    const finalUSD = parseFloat(document.getElementById('cashierOpeningUSD').value) || 0;
    try {
      const result = await api.post('/cajero/cerrar-caja', {
        caja_id: currentCajaId,
        final_bs: finalBS,
        final_usd: finalUSD,
        comentario: ''
      });
      cajaAbierta = false;
      cashierStatus.textContent = 'Caja cerrada';
      cashierStatus.style.color = 'red';
      alert(`Caja cerrada. Diferencia Bs: ${result.diferencia.bs.toFixed(2)}, USD: ${result.diferencia.usd.toFixed(2)}`);
    } catch (err) {
      alert('Error al cerrar caja: ' + err.message);
    }
  }

  // ========== COBRO ==========
  btnCheckoutPOS.addEventListener('click', async () => {
    if (currentCart.length === 0) return alert('Agrega productos a la orden');
    if (!cajaAbierta) return alert('Debes abrir la caja primero');

    const metodo = posPaymentMethod.value;
    let datosPago = {};
    if (metodo === 'pago_movil') {
      datosPago = {
        banco: document.getElementById('posPmBanco')?.value,
        telefono: document.getElementById('posPmTelefono')?.value,
        cedula: document.getElementById('posPmCedula')?.value,
      };
    } else if (metodo === 'transferencia') {
      datosPago = {
        banco: document.getElementById('posTransfBanco')?.value,
        referencia: document.getElementById('posTransfReferencia')?.value,
      };
    } else if (metodo === 'tarjeta') {
      datosPago = {
        numero: document.getElementById('posTarjetaNumero')?.value,
        titular: document.getElementById('posTarjetaTitular')?.value,
        vencimiento: document.getElementById('posTarjetaVencimiento')?.value,
        cvv: document.getElementById('posTarjetaCVV')?.value,
      };
    }

    try {
      const res = await api.post('/cajero/venta', {
        items: currentCart.map(i => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          unidad_id: i.unidad_id
        })),
        metodo_pago: metodo,
        datos_pago: datosPago,
        cliente_id: selectedClient?.id || null,
        descuento_bs: 0,
        descuento_usd: 0,
        comentario: ''
      });
      lastOrderId = res.id;
      currentCart = [];
      renderCart();
      posInvoiceArea.style.display = 'block';
      loadLastOrders();
      alert('Venta realizada con éxito');
    } catch (err) {
      alert('Error al procesar la venta: ' + err.message);
    }
  });

  btnDownloadPosInvoice?.addEventListener('click', async () => {
    if (!lastOrderId) return;
    try {
      const pedido = await api.get(`/cajero/pedido/${lastOrderId}`);
      const invoiceDiv = document.getElementById('invoicePrintable');
      const content = document.getElementById('invoiceContent');
      content.innerHTML = `
        <h2>Sol Manager - Factura</h2>
        <p>Pedido #${pedido.id.substring(0,8)}</p>
        <p>Fecha: ${new Date(pedido.fecha_pedido).toLocaleString()}</p>
        <p>Cajero: ${user.nombre}</p>
        ${pedido.usuario_id ? `<p>Cliente: ${selectedClient?.nombre || ''}</p>` : ''}
        <hr>
        <table style="width:100%; border-collapse:collapse;">
          <tr><th>Producto</th><th>Cant.</th><th>Precio USD</th><th>Subtotal USD</th></tr>
          ${pedido.items.map(it => `
            <tr>
              <td>${it.producto_nombre || it.producto_id}</td>
              <td>${it.cantidad}</td>
              <td>$${parseFloat(it.precio_unitario_usd).toFixed(2)}</td>
              <td>$${parseFloat(it.subtotal_usd).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <hr>
        <p><strong>Total USD:</strong> $${parseFloat(pedido.total_usd).toFixed(2)}</p>
        <p><strong>Total Bs:</strong> Bs.${parseFloat(pedido.total_bs).toFixed(2)}</p>
        <p>Gracias por su compra</p>
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

  async function loadLastOrders() {
    try {
      const pedidos = await api.get('/cajero/pedidos-dia');
      posOrdersContainer.innerHTML = pedidos.length ? pedidos.map(p => `
        <div class="order-card">
          <div class="order-header">
            <span>Pedido #${p.id.substring(0,8)}</span>
            <span class="order-status ${p.estado}">${p.estado}</span>
          </div>
          <div>Total: $${p.total_usd} / Bs.${p.total_bs}</div>
          <div>Fecha: ${new Date(p.fecha_pedido).toLocaleString()}</div>
          <button class="btn-reprint" data-id="${p.id}">Reimprimir</button>
          ${p.estado !== 'cancelado' ? `<button class="btn-void" data-id="${p.id}">Anular</button>` : ''}
        </div>
      `).join('') : '<p>No hay ventas hoy</p>';

      posOrdersContainer.querySelectorAll('.btn-reprint').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const pedido = await api.get(`/cajero/pedido/${id}`);
          lastOrderId = id;
          btnDownloadPosInvoice.click();
        });
      });

      posOrdersContainer.querySelectorAll('.btn-void').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (confirm('¿Anular este pedido? Se revertirá el inventario.')) {
            try {
              await api.put(`/cajero/pedido/${id}/anular`);
              loadLastOrders();
            } catch (e) { alert('Error: ' + e.message); }
          }
        });
      });
    } catch (err) {
      posOrdersContainer.innerHTML = '<p>Error al cargar pedidos</p>';
    }
  }

  // ========== EVENTOS DEL POS ==========
  posProductSearch?.addEventListener('input', (e) => searchProducts(e.target.value));
  posPaymentMethod?.addEventListener('change', function() {
    const method = this.value;
    Object.values(paymentFields).forEach(el => el.style.display = 'none');
    posCashSection.style.display = 'none';
    if (method === 'efectivo') {
      posCashSection.style.display = 'block';
    } else if (paymentFields[method]) {
      paymentFields[method].style.display = 'block';
    }
  });
  btnOpenCashier?.addEventListener('click', openCashier);
  btnCloseCashier?.addEventListener('click', closeCashier);
  btnSearchClient?.addEventListener('click', () => searchClients(posClientSearch.value.trim()));
  posClientSearch?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchClients(posClientSearch.value.trim());
  });
  document.addEventListener('click', (e) => {
    if (!posClientSearch.contains(e.target) && !posClientDropdown.contains(e.target)) {
      posClientDropdown.style.display = 'none';
    }
  });
  btnClearClient?.addEventListener('click', clearClient);

  // Botón para abrir modal de nueva persona (ya existe en dashboard.html)
  document.getElementById('btnNewClient')?.addEventListener('click', () => {
    document.getElementById('modalPerson').style.display = 'flex';
  });
  document.getElementById('btnSavePerson')?.addEventListener('click', async () => {
    const nombre = document.getElementById('personName').value.trim();
    const apellido = document.getElementById('personLastName').value.trim();
    const cedula = document.getElementById('personCedula').value.trim();
    const telefono = document.getElementById('personPhone').value.trim();
    if (!nombre) return alert('Nombre obligatorio');
    try {
      const nueva = await api.post('/cajero/personas', { nombre, apellido, cedula, telefono });
      selectClient(nueva);
      document.getElementById('modalPerson').style.display = 'none';
    } catch (e) { alert(e.message); }
  });
  document.getElementById('closePersonModal')?.addEventListener('click', () => {
    document.getElementById('modalPerson').style.display = 'none';
  });

  // Crear usuario completo (modal existente)
  document.getElementById('btnAddUserFull')?.addEventListener('click', () => {
    document.getElementById('modalUser').style.display = 'flex';
  });
  document.getElementById('btnSaveFullUser')?.addEventListener('click', async () => {
    const nombre = document.getElementById('fullUserName').value.trim();
    const apellido = document.getElementById('fullUserLastName').value.trim();
    const cedula = document.getElementById('fullUserCedula').value.trim();
    const telefono = document.getElementById('fullUserPhone').value.trim();
    const email = document.getElementById('fullUserEmail').value.trim();
    const password = document.getElementById('fullUserPassword').value;
    const rol = document.getElementById('fullUserRole').value;
    if (!email || !password) return alert('Email y contraseña requeridos');
    try {
      const nuevo = await api.post('/cajero/crear-usuario', { nombre, apellido, cedula, telefono, email, password, rol });
      alert('Usuario creado con éxito');
      document.getElementById('modalUser').style.display = 'none';
      if (rol === 'cliente') selectClient(nuevo);
    } catch (e) { alert(e.message); }
  });
  document.getElementById('closeUserModal')?.addEventListener('click', () => {
    document.getElementById('modalUser').style.display = 'none';
  });

  // ========== NUEVA SECCIÓN: VISTA DE CLIENTES ==========
  const clientesTableContainer = document.getElementById('clientesTableContainer');
  
  async function loadClientes() {
    try {
      const clientes = await api.get('/cajero/clientes?buscar='); // obtiene todos
      renderClientesTable(clientes);
    } catch (err) {
      clientesTableContainer.innerHTML = `<p class="error">Error al cargar clientes</p>`;
    }
  }

  function renderClientesTable(clientes) {
    if (!clientesTableContainer) return;
    if (clientes.length === 0) {
      clientesTableContainer.innerHTML = '<p>No hay clientes registrados</p>';
      return;
    }

    let html = `
      <table class="cart-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    clientes.forEach(c => {
      html += `
        <tr>
          <td>${c.nombre} ${c.apellido}</td>
          <td>${c.cedula || '-'}</td>
          <td>${c.telefono || '-'}</td>
          <td>${c.email || '<span style="color:gray;">Sin cuenta</span>'}</td>
          <td>
            ${!c.email ? `<button class="btn-delete-persona" data-id="${c.id}">🗑️ Eliminar</button>` : '<span style="font-size:0.8rem;">Usuario con cuenta</span>'}
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    clientesTableContainer.innerHTML = html;

    // Asignar eventos de eliminación
    clientesTableContainer.querySelectorAll('.btn-delete-persona').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('¿Eliminar esta persona? Esta acción no se puede deshacer.')) {
          try {
            await api.delete(`/cajero/persona/${id}`);
            loadClientes(); // recargar tabla
          } catch (e) {
            alert('Error al eliminar: ' + e.message);
          }
        }
      });
    });
  }

  // Escuchar cuando se muestre la vista de clientes (a través del menú)
  // Aprovechamos el sistema de navegación de dashboard.js: al cambiar a view-cashier-clients se cargará la tabla
  // Nos enganchamos al cambio de hash
  window.addEventListener('hashchange', () => {
    const viewId = window.location.hash.substring(1);
    if (viewId === 'view-cashier-clients') loadClientes();
  });

  // También cargamos si ya estamos en esa vista al inicializar (por si se recarga la página)
  if (window.location.hash.substring(1) === 'view-cashier-clients') {
    loadClientes();
  }

  // Opcional: ocultar botón "Nueva persona" de esta vista, ya lo tenemos en POS.
  // En dashboard.html, el botón "btnAddPerson" está dentro de view-cashier-clients; lo ocultamos.
  const btnAddPerson = document.getElementById('btnAddPerson');
  if (btnAddPerson) btnAddPerson.style.display = 'none';

  // Carga inicial de los pedidos del día (en POS)
  loadLastOrders();
}