// models/stockModel.js - Operaciones con movimientos de stock
const pool = require('../config/db');

// Obtener todos los movimientos de stock con detalles
const getStockMovements = async () => {
  const result = await pool.query(`
    SELECT 
      m.id_movimiento,
      m.tipo,
      m.cantidad,
      m.descripcion,
      m.fecha,
      u.nombre AS usuario_nombre,
      p.nombre AS producto_nombre,
      a.nombre AS almacen_nombre,
      s.cantidad_actual
    FROM movimientos_stock m
    JOIN stock s ON m.id_stock = s.id_stock
    JOIN productos p ON s.id_producto = p.id_producto
    JOIN almacenes a ON s.id_almacen = a.id_almacen
    JOIN usuarios u ON m.id_usuario = u.id_usuario
    ORDER BY m.fecha DESC
  `);
  return result.rows;
};

// Registrar un movimiento de stock
const createStockMovement = async (id_stock, tipo, cantidad, descripcion, id_usuario) => {
  const result = await pool.query(
    `INSERT INTO movimientos_stock (id_stock, tipo, cantidad, descripcion, id_usuario)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id_stock, tipo, cantidad, descripcion, id_usuario]
  );
  return result.rows[0];
};

// Actualizar la cantidad actual en stock
const updateStockQuantity = async (id_stock, nueva_cantidad) => {
  const result = await pool.query(
    `UPDATE stock SET cantidad_actual = $1, fecha_actualizacion = NOW()
     WHERE id_stock = $2 RETURNING *`,
    [nueva_cantidad, id_stock]
  );
  return result.rows[0];
};

// Obtener stock por producto y almacén
const getStockByProductAndWarehouse = async (id_producto, id_almacen) => {
  const result = await pool.query(
    `SELECT * FROM stock WHERE id_producto = $1 AND id_almacen = $2`,
    [id_producto, id_almacen]
  );
  return result.rows[0];
};

module.exports = {
  getStockMovements,
  createStockMovement,
  updateStockQuantity,
  getStockByProductAndWarehouse
};