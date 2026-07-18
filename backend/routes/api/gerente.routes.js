const express = require('express');
const router = express.Router();
const gerenteController = require('../../controllers/gerenteController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

// Middleware para todas las rutas
router.use(autenticar);
router.use(autorizar('gerente', 'admin'));

// Usuarios
router.get('/usuarios', gerenteController.listarUsuarios);
router.post('/usuarios', gerenteController.crearUsuario);
router.put('/usuarios/:id', gerenteController.actualizarUsuario);

// Productos
router.get('/productos', gerenteController.listarProductos);
router.post('/productos', gerenteController.crearProducto);
router.put('/productos/:id', gerenteController.actualizarProducto);
router.delete('/productos/:id', gerenteController.eliminarProducto);

// Almacenes
router.get('/almacenes', gerenteController.listarAlmacenes);
router.post('/almacenes', gerenteController.crearAlmacen);
router.put('/almacenes/:id', gerenteController.actualizarAlmacen);

// Proveedores
router.get('/proveedores', gerenteController.listarProveedores);
router.post('/proveedores', gerenteController.crearProveedor);
router.put('/proveedores/:id', gerenteController.actualizarProveedor);

// Devoluciones
router.get('/devoluciones', gerenteController.listarDevoluciones);
router.post('/devoluciones/:id/resolver', gerenteController.resolverDevolucion);

// Reportes
router.get('/reportes/ventas', gerenteController.reportesVentas);
router.get('/reportes/productos-mas-vendidos', gerenteController.productosMasVendidos);
router.get('/reportes/ventas-por-metodo', gerenteController.ventasPorMetodoPago);

module.exports = router;