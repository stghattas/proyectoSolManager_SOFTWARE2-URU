const pool = require('../config/database');
const sql = require('../sql/usuarios.sql');

async function crearUsuario({ nombre, apellido, email, passwordHash, rol }) {
  const { rows } = await pool.query(sql.crearUsuario, [nombre, apellido, email, passwordHash, rol]);
  return rows[0];
}

async function buscarPorEmail(email) {
  const { rows } = await pool.query(sql.buscarPorEmail, [email]);
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await pool.query(sql.buscarPorId, [id]);
  return rows[0];
}

module.exports = { crearUsuario, buscarPorEmail, buscarPorId };