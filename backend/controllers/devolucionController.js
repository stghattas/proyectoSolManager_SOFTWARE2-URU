// controllers/devolucionController.js
const pool = require('../config/database');

exports.solicitarDevolucion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { pedido_id, motivo, items } = req.body; // items: [{ pedido_item_id, cantidad }]
    if (!pedido_id || !motivo || !items || !items.length) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar que el pedido pertenezca al usuario y esté entregado
    const pedido = await client.query(
      'SELECT id FROM pedidos WHERE id=$1 AND usuario_id=$2 AND estado_id=(SELECT id FROM estados_pedido WHERE nombre=\'entregado\')',
      [pedido_id, req.usuario.id]
    );
    if (!pedido.rows.length) return res.status(400).json({ error: 'Pedido no válido para devolución' });

    await client.query('BEGIN');

    const devRes = await client.query(
      `INSERT INTO devoluciones (pedido_id, usuario_id, motivo, estado_id)
       VALUES ($1, $2, $3, (SELECT id FROM estados_devolucion WHERE nombre='pendiente'))
       RETURNING id`,
      [pedido_id, req.usuario.id, motivo]
    );
    const devId = devRes.rows[0].id;

    for (const item of items) {
      // Verificar que el item pertenezca al pedido
      const itemCheck = await client.query('SELECT * FROM pedido_items WHERE id=$1 AND pedido_id=$2', [item.pedido_item_id, pedido_id]);
      if (!itemCheck.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Item ${item.pedido_item_id} no pertenece al pedido` });
      }
      await client.query(
        'INSERT INTO devolucion_items (devolucion_id, pedido_item_id, cantidad, producto_id) VALUES ($1,$2,$3,$4)',
        [devId, item.pedido_item_id, item.cantidad, itemCheck.rows[0].producto_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: devId, message: 'Devolución solicitada' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.misDevoluciones = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, ed.nombre as estado
       FROM devoluciones d
       JOIN estados_devolucion ed ON d.estado_id = ed.id
       WHERE d.usuario_id = $1
       ORDER BY d.fecha_solicitud DESC`,
      [req.usuario.id]
    );
    // Opcionalmente incluir items
    for (let d of rows) {
      const items = await pool.query(
        `SELECT di.*, pr.nombre as producto_nombre
         FROM devolucion_items di
         JOIN productos pr ON di.producto_id = pr.id
         WHERE di.devolucion_id = $1`, [d.id]
      );
      d.items = items.rows;
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};