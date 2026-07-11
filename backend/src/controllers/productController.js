// controllers/productController.js
const { getAllProducts } = require('../models/productModel');

const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
};

module.exports = { getProducts };