const express = require('express');
const router = express.Router();
const repartidorController = require('../../controllers/repartidorController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

router.get('/pedidos', autenticar, autorizar('repartidor'), repartidorController.pedidosDisponibles);
router.put('/estado', autenticar, autorizar('repartidor'), repartidorController.actualizarEstado);
router.post('/mensaje', autenticar, autorizar('repartidor'), repartidorController.enviarMensaje);
router.get('/mensajes/:pedido_id', autenticar, autorizar('repartidor'), repartidorController.obtenerMensajes);

module.exports = router;