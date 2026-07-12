const pool = require('../config/database');
const sql = require('../sql/caja.sql');

async function abrirCaja(cajeroId, inicialBS, inicialUSD) {
  const { rows } = await pool.query(sql.abrirCaja, [cajeroId, inicialBS, inicialUSD]);
  return rows[0];
}

async function cerrarCaja(cajaId, finalBS, finalUSD, diferenciaBS, diferenciaUSD, comentario) {
  await pool.query(sql.cerrarCaja, [cajaId, finalBS, finalUSD, diferenciaBS, diferenciaUSD, comentario]);
}

async function obtenerCajaAbierta(cajeroId) {
  const { rows } = await pool.query(sql.cajaAbierta, [cajeroId]);
  return rows[0];
}

module.exports = { abrirCaja, cerrarCaja, obtenerCajaAbierta };