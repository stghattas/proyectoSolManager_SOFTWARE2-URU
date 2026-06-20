// models/userModel.js - Operaciones con la tabla 'usuarios'
const pool = require('../config/db');

// Buscar un usuario por correo
const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
  return result.rows[0];
};

// Crear un nuevo usuario
const createUser = async (email, password, name, role = 'cliente') => {
  const result = await pool.query(
    'INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, password, role]
  );
  return result.rows[0];
};

module.exports = { findUserByEmail, createUser };