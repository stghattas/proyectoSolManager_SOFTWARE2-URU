const pool = require('../config/db');

const getAllProducts = async () => {
  const result = await pool.query(`
    SELECT 
      id_producto AS id,
      nombre AS name,
      descripcion AS description,
      categoria AS category,
      unidad_base AS unit_base,
      precio_compra_ves,
      precio_venta_ves AS price_ves,
      precio_venta_usd AS price_usd,
      imagen_url,
      activo AS active
    FROM productos 
    WHERE activo = true 
    ORDER BY id_producto
  `);
  return result.rows;
};

const createProduct = async (data) => {
  const { nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, precio_venta_usd, imagen_url } = data;
  const result = await pool.query(
    `INSERT INTO productos (nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, precio_venta_usd, imagen_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, precio_venta_usd, imagen_url]
  );
  return result.rows[0];
};

const updateProduct = async (id, data) => {
  const { nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, precio_venta_usd, imagen_url, activo } = data;
  const result = await pool.query(
    `UPDATE productos SET 
      nombre = COALESCE($1, nombre),
      descripcion = COALESCE($2, descripcion),
      categoria = COALESCE($3, categoria),
      unidad_base = COALESCE($4, unidad_base),
      precio_compra_ves = COALESCE($5, precio_compra_ves),
      precio_venta_ves = COALESCE($6, precio_venta_ves),
      precio_venta_usd = COALESCE($7, precio_venta_usd),
      imagen_url = COALESCE($8, imagen_url),
      activo = COALESCE($9, activo)
     WHERE id_producto = $10 RETURNING *`,
    [nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, precio_venta_usd, imagen_url, activo, id]
  );
  return result.rows[0];
};

const deleteProduct = async (id) => {
  const result = await pool.query(
    `UPDATE productos SET activo = false WHERE id_producto = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};