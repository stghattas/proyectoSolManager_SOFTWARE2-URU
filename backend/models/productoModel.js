const pool = require('../config/database');
const sql = require('../sql/productos.sql');

async function listar(filtro = {}) {
  let query = sql.listarTodos;
  let params = [];
  if (filtro.categoria) {
    query = sql.buscarPorCategoria;
    params = [filtro.categoria];
  } else if (filtro.buscar) {
    query = sql.buscarPorNombre;
    params = [filtro.buscar];
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function obtener(id) {
  const { rows } = await pool.query(sql.obtenerPorId, [id]);
  return rows[0];
}

async function crear(data) {
  const { rows } = await pool.query(sql.crear, [
    data.nombre, data.descripcion, data.categoria_id, data.precio_bs, data.precio_usd,
    data.unidad_medida_base_id, data.codigo_barras, data.stock_minimo || 0, data.imagen_url
  ]);
  return rows[0];
}

async function actualizar(id, data) {
  const { rows } = await pool.query(sql.actualizar, [
    data.nombre, data.descripcion, data.precio_bs, data.precio_usd,
    data.unidad_medida_base_id, data.categoria_id, data.imagen_url, id
  ]);
  return rows[0];
}

async function eliminar(id) {
  await pool.query(sql.deshabilitar, [id]);
}
async function obtenerVarios(ids) {
  if (!ids || ids.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT * FROM productos WHERE id = ANY($1::uuid[]) AND activo = true`, [ids]
  );
  return rows;
}

module.exports = { listar, obtener, crear, actualizar, eliminar, obtenerVarios };