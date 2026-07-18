const pool = require('../config/database');
const pedidoModel = require('../models/pedidoModel');
const productoModel = require('../models/productoModel');
const cajaModel = require('../models/cajaModel');
const bcrypt = require('bcryptjs');

// ========== VENTA RÁPIDA ==========
exports.ventaRapida = async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, metodo_pago, datos_pago, comentario, descuento_bs, descuento_usd, cliente_id } = req.body;
    if (!items || !metodo_pago) {
      return res.status(400).json({ error: 'Items y método de pago son requeridos' });
    }

    const ids = items.map(i => i.producto_id);
    const productos = await productoModel.obtenerVarios(ids);
    const prodMap = {};
    productos.forEach(p => { prodMap[p.id] = p; });

    let subtotal_bs = 0, subtotal_usd = 0;
    const itemsProcesados = [];

    for (const item of items) {
      const prod = prodMap[item.producto_id];
      if (!prod) return res.status(400).json({ error: `Producto ${item.producto_id} no encontrado` });
      const cantidad = item.cantidad || 1;
      const precio_bs = parseFloat(prod.precio_bs);
      const precio_usd = parseFloat(prod.precio_usd);
      const sub_bs = precio_bs * cantidad;
      const sub_usd = precio_usd * cantidad;
      subtotal_bs += sub_bs;
      subtotal_usd += sub_usd;

      itemsProcesados.push({
        producto_id: prod.id,
        cantidad,
        unidad_id: prod.unidad_medida_base_id,
        precio_unitario_bs: precio_bs,
        precio_unitario_usd: precio_usd,
        subtotal_bs: sub_bs,
        subtotal_usd: sub_usd,
      });
    }

    const desc_bs = parseFloat(descuento_bs) || 0;
    const desc_usd = parseFloat(descuento_usd) || 0;
    const total_bs = subtotal_bs - desc_bs;
    const total_usd = subtotal_usd - desc_usd;

    await client.query('BEGIN');

   const pedidoRes = await client.query(
  `INSERT INTO pedidos (usuario_id, cajero_id, direccion_entrega_id, subtotal_bs, subtotal_usd, 
    descuento_bs, descuento_usd, impuesto_bs, impuesto_usd, total_bs, total_usd, metodo_pago, datos_pago, comentario, estado_id)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, 
     (SELECT id FROM estados_pedido WHERE nombre = 'entregado'))
   RETURNING id, total_bs, total_usd, fecha_pedido`,
  [cliente_id || null, req.usuario.id, null, subtotal_bs, subtotal_usd,
   desc_bs, desc_usd, 0, 0, total_bs, total_usd,
   metodo_pago, datos_pago || {}, comentario || '']
);
    const pedido = pedidoRes.rows[0];

    for (const item of itemsProcesados) {
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, unidad_id, precio_unitario_bs, precio_unitario_usd, subtotal_bs, subtotal_usd)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [pedido.id, item.producto_id, item.cantidad, item.unidad_id,
         item.precio_unitario_bs, item.precio_unitario_usd, item.subtotal_bs, item.subtotal_usd]
      );
      await client.query(
        `UPDATE inventario_almacen SET cantidad = cantidad - $1, actualizado_en = NOW()
         WHERE producto_id = $2 AND almacen_id = 'a1000000-0000-0000-0000-000000000001'`,
        [item.cantidad, item.producto_id]
      );
      await client.query(
        `INSERT INTO movimientos_inventario (producto_id, almacen_id, tipo, cantidad, unidad_id, usuario_id, referencia, motivo)
         VALUES ($1, 'a1000000-0000-0000-0000-000000000001', 'salida', $2, $3, $4, $5, $6)`,
        [item.producto_id, item.cantidad, item.unidad_id, req.usuario.id, `Venta pedido ${pedido.id}`, 'venta']
      );
    }

    await client.query('COMMIT');
    res.status(201).json(pedido);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ========== CAJA ==========
exports.abrirCaja = async (req, res) => {
  try {
    const { inicial_bs, inicial_usd } = req.body;
    const caja = await cajaModel.abrirCaja(req.usuario.id, inicial_bs, inicial_usd);
    res.json(caja);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cerrarCaja = async (req, res) => {
  try {
    const { caja_id, final_bs, final_usd, comentario } = req.body;
    const ventas = await pool.query(
      `SELECT COALESCE(SUM(total_bs),0) as ventas_bs, COALESCE(SUM(total_usd),0) as ventas_usd
       FROM pedidos
       WHERE cajero_id = $1 AND fecha_pedido::date = CURRENT_DATE AND estado_id != (SELECT id FROM estados_pedido WHERE nombre = 'cancelado')`,
      [req.usuario.id]
    );
    const cajaAbierta = await cajaModel.obtenerCajaAbierta(req.usuario.id);
    if (!cajaAbierta) return res.status(400).json({ error: 'No hay caja abierta' });

    const montoInicialBS = parseFloat(cajaAbierta.monto_inicial_bs);
    const montoInicialUSD = parseFloat(cajaAbierta.monto_inicial_usd);
    const ventasBS = parseFloat(ventas.rows[0].ventas_bs);
    const ventasUSD = parseFloat(ventas.rows[0].ventas_usd);
    const esperadoBS = montoInicialBS + ventasBS;
    const esperadoUSD = montoInicialUSD + ventasUSD;
    const diferenciaBS = final_bs - esperadoBS;
    const diferenciaUSD = final_usd - esperadoUSD;

    await cajaModel.cerrarCaja(caja_id, final_bs, final_usd, diferenciaBS, diferenciaUSD, comentario);
    res.json({
      message: 'Caja cerrada',
      esperado: { bs: esperadoBS, usd: esperadoUSD },
      diferencia: { bs: diferenciaBS, usd: diferenciaUSD }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.pedidosDelDia = async (req, res) => {
  try {
    const pedidos = await pedidoModel.pedidosDelDia();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== CLIENTES ==========
exports.listarClientes = async (req, res) => {
  try {
    const buscar = req.query.buscar || '';
    const { rows } = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.cedula, u.telefono, u.email,
             COALESCE(p.ordenes, 0) as total_pedidos
      FROM usuarios u
      LEFT JOIN (
        SELECT usuario_id, COUNT(*) as ordenes FROM pedidos WHERE activo = true GROUP BY usuario_id
      ) p ON u.id = p.usuario_id
      WHERE u.rol_id = (SELECT id FROM roles WHERE nombre = 'cliente')
        AND (u.nombre ILIKE '%' || $1 || '%' OR u.apellido ILIKE '%' || $1 || '%' OR u.cedula ILIKE '%' || $1 || '%')
      ORDER BY u.nombre ASC
    `, [buscar]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.pedidosDeCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT p.*, e.nombre as estado
      FROM pedidos p
      JOIN estados_pedido e ON p.estado_id = e.id
      WHERE p.usuario_id = $1 AND p.activo = true
      ORDER BY p.fecha_pedido DESC
    `, [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearPersona = async (req, res) => {
  try {
    const { nombre, apellido, cedula, telefono } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const { rows } = await pool.query(`
      INSERT INTO usuarios (nombre, apellido, cedula, telefono, rol_id)
      VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = 'cliente'))
      RETURNING id, nombre, apellido, cedula, telefono
    `, [nombre, apellido || '', cedula, telefono]);

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearUsuarioCompleto = async (req, res) => {
  try {
    const { persona_id, nombre, apellido, cedula, telefono, email, password, rol } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    if (persona_id) {
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(`
        UPDATE usuarios
        SET email = $1, password_hash = $2, nombre = $3, apellido = $4, cedula = $5, telefono = $6
        WHERE id = $7
        RETURNING id, nombre, apellido, email, telefono, cedula
      `, [email, hash, nombre, apellido || '', cedula, telefono, persona_id]);
      return res.json(rows[0]);
    } else {
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(`
        INSERT INTO usuarios (nombre, apellido, cedula, telefono, email, password_hash, rol_id)
        VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM roles WHERE nombre = $7))
        RETURNING id, nombre, apellido, email, telefono
      `, [nombre, apellido || '', cedula, telefono, email, hash, rol || 'cliente']);
      return res.status(201).json(rows[0]);
    }
  } catch (error) {
    if (error.constraint === 'usuarios_email_key') {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ========== OBTENER PEDIDO Y ANULAR ==========
exports.obtenerPedido = async (req, res) => {
  try {
    const pedido = await pedidoModel.obtener(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.anularPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const pedidoRes = await client.query(
      `SELECT p.*, e.nombre as estado FROM pedidos p
       JOIN estados_pedido e ON p.estado_id = e.id
       WHERE p.id = $1`, [id]
    );
    if (pedidoRes.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    const pedido = pedidoRes.rows[0];
    if (pedido.estado === 'cancelado') return res.status(400).json({ error: 'El pedido ya fue cancelado' });

    await client.query('BEGIN');
    const items = await client.query(`SELECT * FROM pedido_items WHERE pedido_id = $1`, [id]);
    for (const item of items.rows) {
      await client.query(
        `UPDATE inventario_almacen SET cantidad = cantidad + $1, actualizado_en = NOW()
         WHERE producto_id = $2 AND almacen_id = 'a1000000-0000-0000-0000-000000000001'`,
        [item.cantidad, item.producto_id]
      );
      await client.query(
        `INSERT INTO movimientos_inventario (producto_id, almacen_id, tipo, cantidad, unidad_id, usuario_id, referencia, motivo)
         VALUES ($1, 'a1000000-0000-0000-0000-000000000001', 'entrada', $2, $3, $4, $5, $6)`,
        [item.producto_id, item.cantidad, item.unidad_id, req.usuario.id, `Anulación pedido ${id}`, 'devolucion_anulacion']
      );
    }
    await client.query(
      `UPDATE pedidos SET estado_id = (SELECT id FROM estados_pedido WHERE nombre = 'cancelado'), activo = false WHERE id = $1`,
      [id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Pedido anulado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ========== ELIMINAR PERSONA (cliente sin email) ==========
exports.eliminarPersona = async (req, res) => {
  try {
    const { id } = req.params;
    // Verificar que sea un cliente sin email
    const { rows } = await pool.query(
      `SELECT id, email FROM usuarios WHERE id = $1 AND rol_id = (SELECT id FROM roles WHERE nombre = 'cliente')`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Persona no encontrada' });
    if (rows[0].email) return res.status(400).json({ error: 'No se puede eliminar un usuario con cuenta. Use la gestión de usuarios.' });

    await pool.query(`DELETE FROM usuarios WHERE id = $1`, [id]);
    res.json({ message: 'Persona eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};