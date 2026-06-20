// modules/repartidor.js - Funcionalidades del repartidor
import { apiFetch } from '../utils/api.js';

let assignedDeliveries = [];
let elements = {};

export function initRepartidor(refs) {
  elements = {
    deliveriesContainer: refs.deliveriesContainer
  };

  loadAssignedDeliveries();
}

async function loadAssignedDeliveries() {
  // Por ahora simulamos con localStorage hasta tener endpoint real
  // En producción, usaríamos apiFetch('/entregas/repartidor/' + userId)
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  // Filtrar pedidos que podrían estar en estado "enviado" o "pendiente" (simulación)
  assignedDeliveries = orders.filter(o => ['enviado', 'pendiente', 'confirmado'].includes(o.status));
  renderDeliveries();
}

function renderDeliveries() {
  if (!elements.deliveriesContainer) return;
  if (!assignedDeliveries.length) {
    elements.deliveriesContainer.innerHTML = '<p>No tienes entregas asignadas.</p>';
    return;
  }
  elements.deliveriesContainer.innerHTML = assignedDeliveries.map(order => `
    <div class="delivery-card">
      <div class="delivery-header">
        <strong>Pedido #${order.id}</strong>
        <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
      </div>
      <div>${order.date}</div>
      <div>Dirección: ${order.direccion || 'No especificada'}</div>
      <div>Total: $${order.totalUSD.toFixed(2)}</div>
      <div style="margin-top:0.5rem;">
        <button class="btn-update-delivery" data-id="${order.id}" data-status="recogido">📦 Recogido</button>
        <button class="btn-update-delivery" data-id="${order.id}" data-status="en_ruta">🛵 En ruta</button>
        <button class="btn-update-delivery" data-id="${order.id}" data-status="entregado">✅ Entregado</button>
      </div>
    </div>
  `).join('');

  // Eventos para actualizar estado
  elements.deliveriesContainer.querySelectorAll('.btn-update-delivery').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const newStatus = btn.dataset.status;
      updateDeliveryStatus(id, newStatus);
    });
  });
}

async function updateDeliveryStatus(orderId, newStatus) {
  // Actualizar en localStorage (simulación)
  const orders = JSON.parse(localStorage.getItem('solOrders') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    localStorage.setItem('solOrders', JSON.stringify(orders));
    // Intentar sincronizar con backend si existe endpoint
    try {
      await apiFetch(`/deliveries/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ estado: newStatus })
      });
    } catch (e) { /* ignorar */ }
  }
  loadAssignedDeliveries();
}