const pool = require('../config/db');

const getSuppliers = async () => {
  const result = await pool.query('SELECT * FROM proveedores WHERE activo = true ORDER BY razon_social');
  return result.rows;
};

const createSupplier = async (data) => {
  const { rif, razon_social, direccion, telefono, nombre_contacto } = data;
  const result = await pool.query(
    `INSERT INTO proveedores (rif, razon_social, direccion, telefono, nombre_contacto)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [rif, razon_social, direccion, telefono, nombre_contacto]
  );
  return result.rows[0];
};

module.exports = { getSuppliers, createSupplier };