// modules/gerente.js - Funcionalidades exclusivas del gerente
import { apiFetch } from '../utils/api.js';

export function initGerente(refs) {
  const reportesContainer = refs.reportesContainer;
  if (!reportesContainer) return;

  // Cargar reportes al entrar
  document.getElementById('menu-admin-reportes')?.addEventListener('click', cargarReportes);

  async function cargarReportes() {
    reportesContainer.innerHTML = '<p>Cargando reportes...</p>';
    try {
      // Obtener datos para reportes
      const [productos, movimientos, pedidos] = await Promise.all([
        apiFetch('/warehouse/products').catch(() => []),
        apiFetch('/warehouse/movements').catch(() => []),
        apiFetch('/warehouse/purchases').catch(() => [])
      ]);

      renderReportes(productos, movimientos, pedidos);
    } catch (e) {
      reportesContainer.innerHTML = '<p>Error al cargar reportes.</p>';
    }
  }

  function renderReportes(productos, movimientos, pedidos) {
    const totalProductos = productos.length;
    const productosActivos = productos.filter(p => p.active !== false).length;
    const totalMovimientos = movimientos.length;
    const ultimosMovimientos = movimientos.slice(0, 5);
    const totalCompras = pedidos.length;
    const totalComprasVES = pedidos.reduce((sum, p) => sum + parseFloat(p.total_compra_ves || 0), 0);
    const totalComprasUSD = pedidos.reduce((sum, p) => sum + parseFloat(p.total_compra_usd || 0), 0);

    reportesContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="report-card">
          <h3>📦 Productos</h3>
          <p><strong>Total:</strong> ${totalProductos}</p>
          <p><strong>Activos:</strong> ${productosActivos}</p>
        </div>
        <div class="report-card">
          <h3>📊 Movimientos</h3>
          <p><strong>Total:</strong> ${totalMovimientos}</p>
        </div>
        <div class="report-card">
          <h3>🛒 Compras</h3>
          <p><strong>Total:</strong> ${totalCompras}</p>
          <p><strong>VES:</strong> Bs. ${totalComprasVES.toFixed(2)}</p>
          <p><strong>USD:</strong> $${totalComprasUSD.toFixed(2)}</p>
        </div>
      </div>
      <div class="report-section">
        <h3>Últimos movimientos</h3>
        ${ultimosMovimientos.length ? 
          `<table class="cart-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th></tr></thead><tbody>
            ${ultimosMovimientos.map(m => `
              <tr>
                <td>${new Date(m.fecha).toLocaleString()}</td>
                <td>${m.producto_nombre || '?'}</td>
                <td>${m.tipo}</td>
                <td style="color:${parseFloat(m.cantidad)>=0?'green':'red'}">${m.cantidad}</td>
              </tr>`).join('')}
          </tbody></table>` : '<p>No hay movimientos.</p>'}
      </div>
    `;
  }
}