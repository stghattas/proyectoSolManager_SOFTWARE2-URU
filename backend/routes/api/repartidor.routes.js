const router = require('express').Router();
const repartidorController = require('../../controllers/repartidorController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

router.get('/pedidos', autenticar, autorizar('repartidor'), repartidorController.pedidosAsignados);
router.put('/estado', autenticar, autorizar('repartidor'), repartidorController.actualizarEstadoEntrega);

module.exports = router;