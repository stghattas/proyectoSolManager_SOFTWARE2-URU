// repartidor.js – Módulo completo para el repartidor
import wsClient from '../wsClient.js';

export function init(api, user) {
  // Conexión WebSocket
  wsClient.connect(api.getToken());

  const deliveriesContainer = document.getElementById('deliveriesContainer');

  // ========== LISTENER GLOBAL DE CHAT ==========
  wsClient.on('chat', (msg) => {
    const modal = document.getElementById('chatModal');
    if (!modal || modal.style.display !== 'flex') return; // chat cerrado

    const input = document.getElementById('chatMessageInput');
    if (!input || input.dataset.pedidoId !== msg.pedidoId) return; // no es el pedido actual

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

  // ========== CARGAR PEDIDOS ==========
  async function loadDeliveries() {
    if (!deliveriesContainer) return;
    try {
      const pedidos = await api.get('/repartidor/pedidos');
      if (pedidos.length === 0) {
        deliveriesContainer.innerHTML = '<p>No hay pedidos disponibles en este momento.</p>';
        return;
      }

      deliveriesContainer.innerHTML = pedidos.map(p => {
        const puedeTomar = !p.repartidor_id;               // sin repartidor
        const esMio = p.repartidor_id === user.id;        // ya asignado a mí

        return `
          <div class="delivery-card">
            <div class="delivery-header">
              <span>${p.cliente_nombre || 'Cliente'} – #${p.id.substring(0, 8)}</span>
              <span class="order-status ${p.estado}">${p.estado}</span>
            </div>
            <div>Dirección: ${p.direccion || 'No especificada'}</div>
            <div>Total: $${p.total_usd} / Bs.${p.total_bs}</div>
            ${p.tiempo_estimado_minutos ? `<div>⏱️ Tiempo estimado: ${p.tiempo_estimado_minutos} min</div>` : ''}
            <div class="delivery-actions">
              ${puedeTomar ? `
                <button class="btn-take-order" data-id="${p.id}">👋 Tomar pedido</button>
              ` : ''}
              ${esMio ? `
                <button class="btn-update-delivery" data-id="${p.id}" data-estado="en_camino">🚀 En camino</button>
                <button class="btn-update-delivery" data-id="${p.id}" data-estado="entregado">✅ Entregado</button>
                <button class="btn-update-delivery" data-id="${p.id}" data-estado="no_localizado">📍 No localizado</button>
                <button class="btn-chat-delivery" data-id="${p.id}">💬 Chat con cliente</button>
              ` : (p.repartidor_id ? '<em>Tomado por otro repartidor</em>' : '')}
            </div>
          </div>
        `;
      }).join('');

      // --- Eventos: tomar pedido ---
      document.querySelectorAll('.btn-take-order').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await api.put('/repartidor/estado', { pedido_id: id, estado: 'en_preparacion' });
            alert('Pedido tomado. Ahora está en preparación.');
            loadDeliveries();
          } catch (err) {
            alert(err.message);
          }
        });
      });

      // --- Eventos: actualizar estado ---
      document.querySelectorAll('.btn-update-delivery').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const estado = btn.dataset.estado;
          let tiempo = null;

          if (estado === 'en_camino') {
            tiempo = prompt('⏱️ Tiempo estimado de entrega (minutos):');
            if (tiempo === null) return;
            if (isNaN(tiempo) || parseInt(tiempo) < 0) {
              alert('Ingrese un número válido');
              return;
            }
          }

          try {
            await api.put('/repartidor/estado', {
              pedido_id: id,
              estado,
              tiempo_estimado: tiempo ? parseInt(tiempo) : undefined
            });
            alert('Estado actualizado');
            loadDeliveries();
          } catch (err) {
            alert(err.message);
          }
        });
      });

      // --- Eventos: chat ---
      document.querySelectorAll('.btn-chat-delivery').forEach(btn => {
        btn.addEventListener('click', () => openChat(btn.dataset.id));
      });

    } catch (e) {
      deliveriesContainer.innerHTML = '<p>Error al cargar pedidos.</p>';
    }
  }

  // ========== CHAT ==========
  async function openChat(pedidoId) {
    const modal = document.getElementById('chatModal');
    if (modal) modal.style.display = 'flex';

    let clienteId;
    try {
      const pedido = await api.get(`/pedidos/${pedidoId}`);
      clienteId = pedido.usuario_id;
    } catch (e) {
      alert('No se pudo obtener información del pedido');
      return;
    }

    const input = document.getElementById('chatMessageInput');
    if (input) {
      input.value = '';
      input.dataset.pedidoId = pedidoId;
      input.dataset.to = clienteId;
    }

    const chatDiv = document.getElementById('chatMessages');
    if (chatDiv) {
      try {
        const mensajes = await api.get(`/repartidor/mensajes/${pedidoId}`);
        chatDiv.innerHTML = mensajes.map(m => `
          <div class="chat-message ${m.remitente_id === user.id ? 'mine' : 'other'}">
            <div class="chat-bubble ${m.remitente_id === user.id ? 'mine' : ''}">
              <strong>${m.remitente_nombre}:</strong> ${m.mensaje}
            </div>
          </div>
        `).join('');
      } catch (e) {
        chatDiv.innerHTML = '';
      }
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  }

  // Enviar mensaje
  document.getElementById('btnSendMessage')?.addEventListener('click', () => {
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    const pedidoId = input.dataset.pedidoId;
    const to = input.dataset.to;
    if (!text || !pedidoId || !to) return;
    wsClient.send({ type: 'chat', pedidoId, to, text });
    input.value = '';
    const chatDiv = document.getElementById('chatMessages');
    if (chatDiv) {
      chatDiv.innerHTML += `
        <div class="chat-message mine">
          <div class="chat-bubble mine"><strong>Tú:</strong> ${text}</div>
        </div>`;
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  });

  // Cerrar chat
  document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').style.display = 'none';
  });

  // ========== INICIALIZACIÓN ==========
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#view-delivery-list') loadDeliveries();
  });
  // Cargar automáticamente (el dashboard nos lleva a esta vista)
  loadDeliveries();
}