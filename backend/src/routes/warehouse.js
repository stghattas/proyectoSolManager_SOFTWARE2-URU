const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isAlmacenistaOrAdmin } = require('../middlewares/roles');
const {
  getProducts,
  createProductCtrl,
  updateProductCtrl,
  deleteProductCtrl,
  getWarehousesCtrl,
  createWarehouseCtrl,
  getSuppliersCtrl,
  createSupplierCtrl,
  getMovements,
  registerAdjustment,
  registerPurchase,
  getPurchasesList,
  getPurchaseDetailsById
} = require('../controllers/warehouseController');

// Todas las rutas requieren autenticación y rol almacenista o superior
router.use(verifyToken, isAlmacenistaOrAdmin);

// Productos
router.get('/products', getProducts);
router.post('/products', createProductCtrl);
router.put('/products/:id', updateProductCtrl);
router.delete('/products/:id', deleteProductCtrl);

// Almacenes
router.get('/warehouses', getWarehousesCtrl);
router.post('/warehouses', createWarehouseCtrl);

// Proveedores
router.get('/suppliers', getSuppliersCtrl);
router.post('/suppliers', createSupplierCtrl);

// Movimientos
router.get('/movements', getMovements);
router.post('/adjustments', registerAdjustment);

// Compras
router.post('/purchases', registerPurchase);
router.get('/purchases', getPurchasesList);
router.get('/purchases/:id', getPurchaseDetailsById);

module.exports = router;