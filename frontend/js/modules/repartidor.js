export function init(api, user) {
  const deliveriesContainer = document.getElementById('deliveriesContainer');

  async function loadDeliveries() {
    try {
      const pedidos = await api.get('/repartidor/pedidos');
      if (deliveriesContainer) {
        deliveriesContainer.innerHTML = pedidos.map(p => `
          <div class="delivery-card">
            <div class="delivery-header">
              <span>${p.cliente_nombre || 'Cliente'}</span>
              <span>${p.estado}</span>
            </div>
            <div>Dirección: ${p.direccion || 'No especificada'}</div>
            <div>Total: $${p.total_usd} / Bs.${p.total_bs}</div>
            <div class="delivery-actions">
              <button class="btn-update-delivery" data-id="${p.id}" data-estado="en_camino">En Camino</button>
              <button class="btn-update-delivery" data-id="${p.id}" data-estado="entregado">Entregado</button>
              <button class="btn-update-delivery" data-id="${p.id}" data-estado="no_localizado">No Localizado</button>
            </div>
            <button class="btn-chat-delivery" data-id="${p.id}">💬 Chat</button>
          </div>
        `).join('');

        document.querySelectorAll('.btn-update-delivery').forEach(btn => {
          btn.addEventListener('click', async () => {
            const pedidoId = btn.dataset.id;
            const estado = btn.dataset.estado;
            try {
              await api.put('/repartidor/estado', { pedido_id: pedidoId, estado });
              alert('Estado actualizado');
              loadDeliveries();
            } catch (err) { alert(err.message); }
          });
        });

        document.querySelectorAll('.btn-chat-delivery').forEach(btn => {
          btn.addEventListener('click', () => {
            const chatModal = document.getElementById('chatModal');
            if (chatModal) chatModal.style.display = 'flex';
            const chatInput = document.getElementById('chatMessageInput');
            if (chatInput) chatInput.dataset.pedidoId = btn.dataset.id;
          });
        });
      }
    } catch (e) { console.error(e); }
  }

  document.getElementById('btnSendMessage')?.addEventListener('click', async () => {
    const input = document.getElementById('chatMessageInput');
    const mensaje = input.value.trim();
    const pedidoId = input.dataset.pedidoId;
    if (!mensaje || !pedidoId) return;
    try {
      // Si tienes endpoint de mensajes, úsalo aquí
      const chatDiv = document.getElementById('chatMessages');
      chatDiv.innerHTML += `<div class="chat-message mine"><div class="chat-bubble mine">${mensaje}</div></div>`;
      input.value = '';
    } catch (e) { alert('Error al enviar mensaje'); }
  });

  document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').style.display = 'none';
  });

  loadDeliveries();
}