const express = require('express');
const router = express.Router();
const pedidoController = require('../../controllers/pedidoController');
const autenticar = require('../../middleware/autenticacion');

router.post('/', autenticar, pedidoController.crear);
router.get('/', autenticar, pedidoController.misPedidos);
router.get('/activo/seguimiento', autenticar, pedidoController.seguimiento);
router.get('/:id', autenticar, pedidoController.obtenerDetalle);
router.get('/:id/factura', autenticar, pedidoController.factura);
router.get('/:id/mensajes', autenticar, pedidoController.obtenerMensajes);

module.exports = router;