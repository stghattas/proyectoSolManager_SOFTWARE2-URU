const pool = require('../config/database');
const sql = require('../sql/inventario.sql');

async function stockPorAlmacen(almacenId) {
  const { rows } = await pool.query(sql.stockPorAlmacen, [almacenId]);
  return rows;
}

async function registrarMovimiento({ producto_id, almacen_id, tipo, cantidad, unidad_id, usuario_id, referencia, motivo }) {
  await pool.query(sql.registrarMovimiento, [producto_id, almacen_id, tipo, cantidad, unidad_id, usuario_id, referencia, motivo]);
  // Actualizar stock
  let cantidadAjuste = cantidad;
  if (tipo === 'salida' || tipo === 'merma') cantidadAjuste = -cantidad;
  await pool.query(sql.actualizarStock, [almacen_id, producto_id, cantidadAjuste]);
}

async function alertasStockBajo() {
  const { rows } = await pool.query(sql.productosBajoStock);
  return rows;
}

module.exports = { stockPorAlmacen, registrarMovimiento, alertasStockBajo };