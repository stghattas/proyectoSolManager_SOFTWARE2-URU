const usuarioModel = require('../models/usuarioModel');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// ========== USUARIOS ==========
exports.listarUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, r.nombre as rol, u.activo
       FROM usuarios u JOIN roles r ON u.rol_id = r.id
       ORDER BY u.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, telefono } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol_id)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE nombre = $6))
       RETURNING id, nombre, apellido, email, telefono, (SELECT nombre FROM roles WHERE id = rol_id) as rol`,
      [nombre, apellido || '', email, hash, telefono, rol]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.constraint === 'usuarios_email_key') {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, rol, activo } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) { updates.push(`nombre=$${idx++}`); values.push(nombre); }
    if (apellido !== undefined) { updates.push(`apellido=$${idx++}`); values.push(apellido); }
    if (email !== undefined) { updates.push(`email=$${idx++}`); values.push(email); }
    if (telefono !== undefined) { updates.push(`telefono=$${idx++}`); values.push(telefono); }
    if (rol !== undefined) { updates.push(`rol_id=(SELECT id FROM roles WHERE nombre=$${idx++})`); values.push(rol); }
    if (activo !== undefined) { updates.push(`activo=$${idx++}`); values.push(activo); }

    if (updates.length === 0) return res.status(400).json({ error: 'No hay datos para actualizar' });

    values.push(id);
    await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id=$${idx}`, values);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PRODUCTOS (CRUD desde gerente) ==========
// (asumo que ya tienes productoModel, si no, usa consultas directas)
const productoModel = require('../models/productoModel');

exports.listarProductos = async (req, res) => {
  try {
    const productos = await productoModel.listar();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    const producto = await productoModel.crear(req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const producto = await productoModel.actualizar(req.params.id, req.body);
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    await productoModel.eliminar(req.params.id);
    res.json({ message: 'Producto deshabilitado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== ALMACENES ==========
exports.listarAlmacenes = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM almacenes ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearAlmacen = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO almacenes (nombre, direccion) VALUES ($1, $2) RETURNING *',
      [nombre, direccion || '']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarAlmacen = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, activo } = req.body;
    await pool.query(
      'UPDATE almacenes SET nombre=$1, direccion=$2, activo=$3 WHERE id=$4',
      [nombre, direccion, activo, id]
    );
    res.json({ message: 'Almacén actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PROVEEDORES ==========
exports.listarProveedores = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM proveedores ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearProveedor = async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nombre, contacto || '', telefono, email, direccion || '']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email, direccion, activo } = req.body;
    await pool.query(
      'UPDATE proveedores SET nombre=$1, contacto=$2, telefono=$3, email=$4, direccion=$5, activo=$6 WHERE id=$7',
      [nombre, contacto, telefono, email, direccion, activo, id]
    );
    res.json({ message: 'Proveedor actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== DEVOLUCIONES ==========
exports.listarDevoluciones = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, ed.nombre as estado, p.id as pedido_id, u.nombre as cliente_nombre
       FROM devoluciones d
       JOIN estados_devolucion ed ON d.estado_id = ed.id
       JOIN pedidos p ON d.pedido_id = p.id
       JOIN usuarios u ON d.usuario_id = u.id
       ORDER BY d.fecha_solicitud DESC`
    );
    // Para cada devolución, obtener sus items
    for (let dev of rows) {
      const items = await pool.query(
        `SELECT di.*, pr.nombre as producto_nombre
         FROM devolucion_items di
         JOIN productos pr ON di.producto_id = pr.id
         WHERE di.devolucion_id = $1`, [dev.id]
      );
      dev.items = items.rows;
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolverDevolucion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { accion, comentario } = req.body; // accion: 'aprobar' o 'rechazar'
    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'Acción inválida' });
    }

    const devolucion = await client.query('SELECT * FROM devoluciones WHERE id = $1', [id]);
    if (!devolucion.rows.length) return res.status(404).json({ error: 'Devolución no encontrada' });

    await client.query('BEGIN');

    if (accion === 'aprobar') {
      // Cambiar estado a aprobada
      await client.query(
        `UPDATE devoluciones SET estado_id = (SELECT id FROM estados_devolucion WHERE nombre='aprobada'),
         comentario_gerente = $1, fecha_resolucion = NOW() WHERE id = $2`,
        [comentario || '', id]
      );
      // Reingresar inventario (los items devueltos)
      const items = await client.query('SELECT * FROM devolucion_items WHERE devolucion_id = $1', [id]);
      for (const item of items.rows) {
        await client.query(
          `UPDATE inventario_almacen SET cantidad = cantidad + $1, actualizado_en = NOW()
           WHERE producto_id = $2 AND almacen_id = 'a1000000-0000-0000-0000-000000000001'`,
          [item.cantidad, item.producto_id]
        );
        // Movimiento de inventario (entrada por devolución)
        await client.query(
          `INSERT INTO movimientos_inventario (producto_id, almacen_id, tipo, cantidad, unidad_id, usuario_id, referencia, motivo)
           VALUES ($1, 'a1000000-0000-0000-0000-000000000001', 'entrada', $2, (SELECT unidad_medida_base_id FROM productos WHERE id=$1), $3, $4, $5)`,
          [item.producto_id, item.cantidad, req.usuario.id, `Devolución aprobada ${id}`, 'devolucion_cliente']
        );
      }
    } else {
      // Rechazada
      await client.query(
        `UPDATE devoluciones SET estado_id = (SELECT id FROM estados_devolucion WHERE nombre='rechazada'),
         comentario_gerente = $1, fecha_resolucion = NOW() WHERE id = $2`,
        [comentario || '', id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: `Devolución ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente` });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ========== REPORTES ==========
exports.reportesVentas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DATE(fecha_pedido) as fecha, SUM(total_bs) as total_bs, SUM(total_usd) as total_usd
       FROM pedidos WHERE estado_id = (SELECT id FROM estados_pedido WHERE nombre='entregado')
       GROUP BY DATE(fecha_pedido) ORDER BY fecha DESC LIMIT 30`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.productosMasVendidos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.nombre, SUM(pi.cantidad) as total_vendido, SUM(pi.subtotal_usd) as total_usd
       FROM pedido_items pi
       JOIN productos p ON pi.producto_id = p.id
       JOIN pedidos pe ON pi.pedido_id = pe.id
       WHERE pe.estado_id = (SELECT id FROM estados_pedido WHERE nombre='entregado')
       GROUP BY p.id, p.nombre
       ORDER BY total_vendido DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.ventasPorMetodoPago = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT metodo_pago, COUNT(*) as cantidad, SUM(total_usd) as total_usd
       FROM pedidos WHERE estado_id = (SELECT id FROM estados_pedido WHERE nombre='entregado')
       GROUP BY metodo_pago`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};