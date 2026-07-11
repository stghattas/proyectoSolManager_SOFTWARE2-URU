const pedidoModel = require('../models/pedidoModel');

exports.pedidosAsignados = async (req, res) => {
  // Asumimos que el repartidor tiene pedidos asignados en la BD
  try {
    const { rows } = await require('../config/database').pool.query(`
      SELECT p.*, e.nombre as estado, u.nombre as cliente_nombre, d.direccion
      FROM pedidos p
      JOIN estados_pedido e ON p.estado_id = e.id
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN direcciones_entrega d ON p.direccion_entrega_id = d.id
      WHERE p.repartidor_id = $1 AND p.estado_id NOT IN (SELECT id FROM estados_pedido WHERE nombre='entregado')
      ORDER BY fecha_pedido
    `, [req.usuario.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarEstadoEntrega = async (req, res) => {
  try {
    const { pedido_id, estado } = req.body;
    await pedidoModel.actualizarEstado(pedido_id, estado);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};