const pool = require('../config/database');
const productoModel = require('../models/productoModel');

exports.listar = async (req, res) => {
  try {
    const productos = await productoModel.listar(req.query);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const producto = await productoModel.obtener(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const producto = await productoModel.crear(req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const producto = await productoModel.actualizar(req.params.id, req.body);
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await productoModel.eliminar(req.params.id);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerVarios = async (req, res) => {
  try {
    const productos = await productoModel.obtenerVarios(req.body.ids);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Búsqueda rápida para el cajero
exports.buscarParaPOS = async (req, res) => {
  try {
    const { q, codigo_barras } = req.query;
    let query = `SELECT p.*, u.abreviatura as unidad_abreviatura, c.nombre as categoria_nombre
                 FROM productos p
                 JOIN unidades_medida u ON p.unidad_medida_base_id = u.id
                 JOIN categorias c ON p.categoria_id = c.id
                 WHERE p.activo = true`;
    const params = [];

    if (codigo_barras) {
      query += ` AND p.codigo_barras = $1`;
      params.push(codigo_barras);
    } else if (q) {
      query += ` AND (p.nombre ILIKE $1 OR p.codigo_barras ILIKE $1)`;
      params.push(`%${q}%`);
    } else {
      return res.json([]);
    }

    query += ` ORDER BY p.nombre ASC LIMIT 50`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NUEVAS FUNCIONES PARA UNIDADES Y CATEGORÍAS
exports.listarUnidades = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, abreviatura FROM unidades_medida ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarCategorias = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre FROM categorias WHERE activo = true ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};