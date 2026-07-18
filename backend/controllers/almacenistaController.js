const inventarioModel = require('../models/inventarioModel');
const productoModel = require('../models/productoModel');

exports.movimientos = async (req, res) => {
  try {
    const { tipo, producto_id, almacen_id, cantidad, unidad_id, motivo } = req.body;
    await inventarioModel.registrarMovimiento({
      producto_id, almacen_id, tipo, cantidad, unidad_id,
      usuario_id: req.usuario.id,
      referencia: 'manual',
      motivo
    });
    res.json({ message: 'Movimiento registrado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.alertasStock = async (req, res) => {
  try {
    const alertas = await inventarioModel.alertasStockBajo();
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.comprasProveedor = async (req, res) => {
  // Registra la compra y actualiza inventario
  const { proveedor_id, items } = req.body;
  // Crear compra en BD y movimientos de entrada...
  res.json({ message: 'Compra registrada' });
};

exports.listarMovimientos = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT mi.*, p.nombre as producto_nombre, a.nombre as almacen_nombre
      FROM movimientos_inventario mi
      JOIN productos p ON mi.producto_id = p.id
      JOIN almacenes a ON mi.almacen_id = a.id
      ORDER BY mi.fecha DESC LIMIT 50
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};