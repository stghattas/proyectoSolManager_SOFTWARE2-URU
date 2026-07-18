// controllers/repartidorController.js
const pool = require('../config/database');

// Obtener pedidos disponibles (sin repartidor) + los asignados al repartidor actual
exports.pedidosDisponibles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT p.*, e.nombre as estado, u.nombre as cliente_nombre, u.apellido as cliente_apellido, d.direccion
      FROM pedidos p
      JOIN estados_pedido e ON p.estado_id = e.id
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN direcciones_entrega d ON p.direccion_entrega_id = d.id
      WHERE (
        -- Pedidos sin repartidor y que no estén entregados ni cancelados
        (p.repartidor_id IS NULL AND p.estado_id IN (
          SELECT id FROM estados_pedido WHERE nombre IN ('pendiente','en_preparacion')
        ))
        OR
        -- Pedidos ya asignados a este repartidor y que no estén entregados
        (p.repartidor_id = $1 AND p.estado_id != (
          SELECT id FROM estados_pedido WHERE nombre = 'entregado'
        ))
      )
      AND p.activo = true  -- solo pedidos activos (no ocultos)
      ORDER BY p.fecha_pedido DESC
      `,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en pedidosDisponibles:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tomar un pedido o cambiar su estado (también puede recibir tiempo estimado)
exports.actualizarEstado = async (req, res) => {
  const { pedido_id, estado, tiempo_estimado } = req.body;
  if (!pedido_id || !estado) {
    return res.status(400).json({ error: 'pedido_id y estado son requeridos' });
  }

  try {
    // Verificar que el pedido existe
    const { rows: pedidos } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedido_id]);
    if (pedidos.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedido = pedidos[0];

    // Si el pedido no tiene repartidor, se asigna automáticamente al repartidor actual
    if (!pedido.repartidor_id) {
      await pool.query('UPDATE pedidos SET repartidor_id = $1 WHERE id = $2', [req.usuario.id, pedido_id]);
    } else if (pedido.repartidor_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Este pedido ya fue tomado por otro repartidor' });
    }

    // Validar que el estado es uno de los permitidos
    const estadosValidos = ['pendiente', 'en_preparacion', 'en_camino', 'entregado', 'no_localizado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    // Actualizar el estado del pedido
    await pool.query(
      `UPDATE pedidos SET estado_id = (SELECT id FROM estados_pedido WHERE nombre = $1) WHERE id = $2`,
      [estado, pedido_id]
    );

    // Si se envió tiempo_estimado, actualizar ese campo
    if (tiempo_estimado !== undefined) {
      const minutos = parseInt(tiempo_estimado);
      if (!isNaN(minutos) && minutos >= 0) {
        await pool.query('UPDATE pedidos SET tiempo_estimado_minutos = $1 WHERE id = $2', [minutos, pedido_id]);
      }
    }

    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error en actualizarEstado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Enviar mensaje en un chat (pedido específico)
exports.enviarMensaje = async (req, res) => {
  const { pedido_id, mensaje } = req.body;
  if (!pedido_id || !mensaje) return res.status(400).json({ error: 'pedido_id y mensaje son requeridos' });

  try {
    // Obtener el cliente del pedido para usarlo como destinatario
    const { rows: pedido } = await pool.query('SELECT usuario_id FROM pedidos WHERE id = $1', [pedido_id]);
    if (pedido.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    await pool.query(
      `INSERT INTO mensajes (pedido_id, remitente_id, destinatario_id, mensaje) VALUES ($1, $2, $3, $4)`,
      [pedido_id, req.usuario.id, pedido[0].usuario_id, mensaje]
    );

    res.json({ message: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('Error en enviarMensaje:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener mensajes de un pedido (historial)
exports.obtenerMensajes = async (req, res) => {
  const { pedido_id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.nombre as remitente_nombre
       FROM mensajes m
       JOIN usuarios u ON m.remitente_id = u.id
       WHERE m.pedido_id = $1
       ORDER BY m.fecha ASC`,
      [pedido_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en obtenerMensajes:', error);
    res.status(500).json({ error: error.message });
  }
};