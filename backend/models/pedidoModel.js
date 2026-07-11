const pool = require('../config/database');
const sql = require('../sql/pedidos.sql');

async function crear(pedidoData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pedidoRes = await client.query(sql.crearPedido, [
      pedidoData.usuario_id, pedidoData.cajero_id, pedidoData.direccion_entrega_id,
      pedidoData.subtotal_bs, pedidoData.subtotal_usd, pedidoData.descuento_bs, pedidoData.descuento_usd,
      pedidoData.impuesto_bs, pedidoData.impuesto_usd, pedidoData.total_bs, pedidoData.total_usd,
      pedidoData.metodo_pago, pedidoData.datos_pago, pedidoData.comentario
    ]);
    const pedido = pedidoRes.rows[0];

    for (const item of pedidoData.items) {
      await client.query(sql.crearItem, [
        pedido.id, item.producto_id, item.cantidad, item.unidad_id,
        item.precio_unitario_bs, item.precio_unitario_usd,
        item.subtotal_bs, item.subtotal_usd
      ]);
    }

    // Actualizar inventario (restar stock) aquí si se requiere...
    await client.query('COMMIT');
    return pedido;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function listarPorUsuario(usuarioId) {
  const { rows } = await pool.query(sql.listarPorUsuario, [usuarioId]);
  return rows;
}

async function obtener(id) {
  const { rows: pedidos } = await pool.query(sql.obtenerPorId, [id]);
  if (!pedidos[0]) return null;
  const { rows: items } = await pool.query(sql.obtenerItems, [id]);
  return { ...pedidos[0], items };
}

async function actualizarEstado(id, estado) {
  await pool.query(sql.actualizarEstado, [estado, id]);
}

async function asignarRepartidor(pedidoId, repartidorId) {
  await pool.query(sql.asignarRepartidor, [repartidorId, pedidoId]);
}

async function pedidosDelDia() {
  const { rows } = await pool.query(sql.pedidosDelDia);
  return rows;
}

module.exports = { crear, listarPorUsuario, obtener, actualizarEstado, asignarRepartidor, pedidosDelDia };