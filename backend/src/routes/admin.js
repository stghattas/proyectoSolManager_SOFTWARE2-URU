const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roles');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAlmacenes,
  createAlmacen,
  getProveedores,
  createProveedor
} = require('../controllers/adminController');

// Todas las rutas requieren autenticación y rol admin/gerente
router.use(verifyToken, isAdmin);

// Productos
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Almacenes
router.get('/almacenes', getAlmacenes);
router.post('/almacenes', createAlmacen);

// Proveedores
router.get('/proveedores', getProveedores);
router.post('/proveedores', createProveedor);

module.exports = router;