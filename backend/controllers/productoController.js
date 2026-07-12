const productoModel = require('../models/productoModel');

exports.listar = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.buscar) filtro.buscar = req.query.buscar;
    const productos = await productoModel.listar(filtro);
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
    res.json({ message: 'Producto deshabilitado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};