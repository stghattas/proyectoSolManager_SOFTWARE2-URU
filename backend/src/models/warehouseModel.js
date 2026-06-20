const pool = require('../config/db');

const getWarehouses = async () => {
  const result = await pool.query('SELECT * FROM almacenes ORDER BY id_almacen');
  return result.rows;
};

const createWarehouse = async (data) => {
  const { nombre, ubicacion, tipo } = data;
  const result = await pool.query(
    `INSERT INTO almacenes (nombre, ubicacion, tipo) VALUES ($1, $2, $3) RETURNING *`,
    [nombre, ubicacion, tipo]
  );
  return result.rows[0];
};

module.exports = { getWarehouses, createWarehouse };