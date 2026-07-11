const jwt = require('jsonwebtoken');
const config = require('../config/config');
const usuarioModel = require('../models/usuarioModel');

async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const usuario = await usuarioModel.buscarPorId(decoded.id);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.usuario = usuario; // { id, nombre, apellido, email, telefono, rol }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = autenticar;