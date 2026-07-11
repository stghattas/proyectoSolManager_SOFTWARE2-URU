// controllers/authController.js - Login y registro (sin encriptación)
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');
require('dotenv').config();

// Iniciar sesión (comparación directa de texto plano)
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan el correo o la contraseña' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Comparación directa de texto plano
    if (user.contraseña !== password) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id_usuario, email: user.correo, role: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      accessToken: token,
      user: {
        id: user.id_usuario,
        email: user.correo,
        name: user.nombre,
        role: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Registrar nuevo usuario
const register = async (req, res) => {
  const { email, password, name, role = 'cliente' } = req.body;
  const allowedRoles = ['cliente', 'almacenista'];

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol no válido' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    // Guardar la contraseña en texto plano
    const newUser = await createUser(email, password, name, role);

    const token = jwt.sign(
      { id: newUser.id_usuario, email: newUser.correo, role: newUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      accessToken: token,
      user: {
        id: newUser.id_usuario,
        email: newUser.correo,
        name: newUser.nombre,
        role: newUser.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { login, register };