const express = require('express');
const router = express.Router();

router.use('/auth', require('./api/auth.routes'));
router.use('/productos', require('./api/productos.routes'));
router.use('/cajero', require('./api/cajero.routes'));
router.use('/pedidos', require('./api/pedidos.routes'));
router.use('/almacenista', require('./api/almacenista.routes'));
router.use('/repartidor', require('./api/repartidor.routes'));
router.use('/gerente', require('./api/gerente.routes'));
router.use('/devoluciones', require('./api/devoluciones.routes'));

module.exports = router;