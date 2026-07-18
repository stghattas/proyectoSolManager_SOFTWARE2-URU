const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const usuarioModel = require('../models/usuarioModel');
const config = require('../config/config');

// ----- Registro e inicio de sesión -----
exports.registrar = async (req, res) => {
  try {
    const { nombre, apellido, cedula, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existente = await usuarioModel.buscarPorEmail(email);
    if (existente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await usuarioModel.crearUsuario({
      nombre,
      apellido: apellido || '',
      cedula: cedula || null,
      email,
      passwordHash,
      rol: rol || 'cliente',
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const usuario = await usuarioModel.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// ----- Perfil -----
exports.perfil = async (req, res) => {
  try {
    const usuario = await usuarioModel.buscarPorId(req.usuario.id);
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// ----- Actualizar perfil -----
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono } = req.body;
    const updateFields = {};
    if (nombre) updateFields.nombre = nombre;
    if (apellido) updateFields.apellido = apellido;
    if (telefono) updateFields.telefono = telefono;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const setClauses = Object.keys(updateFields)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(updateFields);
    values.push(req.usuario.id);
    const query = `UPDATE usuarios SET ${setClauses} WHERE id = $${values.length} RETURNING id, nombre, apellido, email, telefono`;
    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ----- Cambiar contraseña -----
exports.cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    const usuario = await usuarioModel.buscarPorId(req.usuario.id);
    if (!usuario || !usuario.password_hash) {
      return res.status(400).json({ error: 'Usuario no válido' });
    }

    const valida = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!valida) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    const nuevoHash = await bcrypt.hash(password_nueva, 10);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [nuevoHash, req.usuario.id]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};