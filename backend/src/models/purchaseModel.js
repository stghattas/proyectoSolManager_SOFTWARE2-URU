// models/purchaseModel.js - Operaciones con compras
const pool = require('../config/db');

// Crear una compra con sus detalles (transacción)
const createPurchase = async (purchaseData, details) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id_proveedor, id_empleado, id_almacen_destino, numero_factura_proveedor, fecha_compra, total_compra_ves, total_compra_usd } = purchaseData;
    const result = await client.query(
      `INSERT INTO compras_mercancia 
       (id_proveedor, id_empleado, id_almacen_destino, numero_factura_proveedor, fecha_compra, total_compra_ves, total_compra_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id_proveedor, id_empleado, id_almacen_destino, numero_factura_proveedor, fecha_compra, total_compra_ves, total_compra_usd]
    );
    const compra = result.rows[0];

    for (const det of details) {
      await client.query(
        `INSERT INTO detalles_compra (id_compra, id_producto, cantidad, precio_unitario_ves, precio_unitario_usd)
         VALUES ($1, $2, $3, $4, $5)`,
        [compra.id_compra, det.id_producto, det.cantidad, det.precio_unitario_ves, det.precio_unitario_usd]
      );
    }

    await client.query('COMMIT');
    return compra;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Obtener todas las compras
const getPurchases = async () => {
  const result = await pool.query(`
    SELECT 
      c.id_compra,
      c.numero_factura_proveedor,
      c.fecha_compra,
      c.total_compra_ves,
      c.total_compra_usd,
      p.razon_social AS proveedor_nombre,
      a.nombre AS almacen_nombre,
      e.cargo AS empleado_cargo,
      u.nombre AS empleado_nombre
    FROM compras_mercancia c
    JOIN proveedores p ON c.id_proveedor = p.id_proveedor
    JOIN almacenes a ON c.id_almacen_destino = a.id_almacen
    JOIN empleados e ON c.id_empleado = e.id_empleado
    JOIN usuarios u ON e.id_empleado = u.id_usuario
    ORDER BY c.fecha_compra DESC
  `);
  return result.rows;
};

// Obtener detalles de una compra
const getPurchaseDetails = async (id_compra) => {
  const result = await pool.query(`
    SELECT 
      d.id_detalle,
      d.cantidad,
      d.precio_unitario_ves,
      d.precio_unitario_usd,
      pr.nombre AS producto_nombre,
      pr.unidad_base
    FROM detalles_compra d
    JOIN productos pr ON d.id_producto = pr.id_producto
    WHERE d.id_compra = $1
  `, [id_compra]);
  return result.rows;
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseDetails
};