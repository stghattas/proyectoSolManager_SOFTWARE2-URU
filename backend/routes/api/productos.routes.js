const express = require('express');
const router = express.Router();
const productoController = require('../../controllers/productoController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

// Rutas fijas (sin parámetros) siempre antes de /:id
router.get('/unidades', productoController.listarUnidades);      // línea 8 aprox.
router.get('/categorias', productoController.listarCategorias);  // línea 9
router.get('/buscar', autenticar, autorizar('cajero', 'admin', 'almacenista'), productoController.buscarParaPOS);

// Rutas con posible parámetro :id
router.get('/', productoController.listar);
router.get('/:id', productoController.obtener);
router.post('/', autenticar, autorizar('admin', 'gerente', 'almacenista'), productoController.crear);
router.put('/:id', autenticar, autorizar('admin', 'gerente', 'almacenista'), productoController.actualizar);
router.delete('/:id', autenticar, autorizar('admin', 'gerente'), productoController.eliminar);
router.post('/varios', autenticar, autorizar('admin', 'cajero', 'almacenista'), productoController.obtenerVarios);

module.exports = router;