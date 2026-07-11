const usuarioModel = require('../models/usuarioModel');
const pool = require('../config/database');

exports.listarUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const usuario = await usuarioModel.crearUsuario({ ...req.body, passwordHash: await bcrypt.hash(req.body.password, 10) });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reportesVentas = async (req, res) => {
  // Implementar queries de reportes
  const { rows } = await pool.query(`SELECT DATE(fecha_pedido) as fecha, SUM(total_bs) as total_bs, SUM(total_usd) as total_usd FROM pedidos WHERE estado_id = (SELECT id FROM estados_pedido WHERE nombre='entregado') GROUP BY DATE(fecha_pedido) ORDER BY fecha DESC LIMIT 30`);
  res.json(rows);
};