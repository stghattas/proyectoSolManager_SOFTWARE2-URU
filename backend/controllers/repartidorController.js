const pool = require('../config/database');

// Pedidos disponibles (no asignados) + pedidos ya tomados por este repartidor
exports.pedidosDisponibles = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, e.nombre as estado, u.nombre as cliente_nombre, d.direccion
      FROM pedidos p
      JOIN estados_pedido e ON p.estado_id = e.id
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN direcciones_entrega d ON p.direccion_entrega_id = d.id
      WHERE (p.repartidor_id IS NULL AND p.estado_id IN (
              SELECT id FROM estados_pedido WHERE nombre IN ('pendiente','en_preparacion')
            ))
         OR (p.repartidor_id = $1 AND p.estado_id != (
              SELECT id FROM estados_pedido WHERE nombre = 'entregado'
            ))
      ORDER BY p.fecha_pedido DESC
    `, [req.usuario.id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Tomar un pedido (asignarse) o actualizar estado
exports.actualizarEstado = async (req, res) => {
  const { pedido_id, estado } = req.body;
  if (!pedido_id || !estado) {
    return res.status(400).json({ error: 'pedido_id y estado son requeridos' });
  }

  try {
    // Verificar que el pedido existe y que el repartidor puede modificarlo
    const { rows: pedidos } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedido_id]);
    if (pedidos.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedido = pedidos[0];

    // Si el pedido no tiene repartidor y se quiere actualizar a otro estado que no sea 'en_preparacion' o similar,
    // primero debe asignarse el repartidor. Vamos a permitir que si está sin repartidor, se asigne automáticamente.
    if (!pedido.repartidor_id) {
      // Asignar el repartidor actual
      await pool.query('UPDATE pedidos SET repartidor_id = $1 WHERE id = $2', [req.usuario.id, pedido_id]);
    } else if (pedido.repartidor_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Este pedido ya fue tomado por otro repartidor' });
    }

    // Validar que el estado es uno de los permitidos
    const estadosValidos = ['en_preparacion', 'en_camino', 'entregado', 'no_localizado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    await pool.query(
      `UPDATE pedidos SET estado_id = (SELECT id FROM estados_pedido WHERE nombre = $1) WHERE id = $2`,
      [estado, pedido_id]
    );

    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Chat (simulado – solo guarda mensaje en BD si la tabla mensajes está creada)
exports.enviarMensaje = async (req, res) => {
  const { pedido_id, mensaje } = req.body;
  if (!pedido_id || !mensaje) return res.status(400).json({ error: 'Faltan datos' });

  try {
    // Insertar mensaje (remitente es el repartidor, destinatario el cliente del pedido)
    const { rows: pedido } = await pool.query('SELECT usuario_id FROM pedidos WHERE id = $1', [pedido_id]);
    if (pedido.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    await pool.query(
      `INSERT INTO mensajes (pedido_id, remitente_id, destinatario_id, mensaje) VALUES ($1, $2, $3, $4)`,
      [pedido_id, req.usuario.id, pedido[0].usuario_id, mensaje]
    );

    res.json({ message: 'Mensaje enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener mensajes de un pedido (para el chat)
exports.obtenerMensajes = async (req, res) => {
  const { pedido_id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.nombre as remitente_nombre FROM mensajes m
       JOIN usuarios u ON m.remitente_id = u.id
       WHERE m.pedido_id = $1 ORDER BY m.fecha ASC`,
      [pedido_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};