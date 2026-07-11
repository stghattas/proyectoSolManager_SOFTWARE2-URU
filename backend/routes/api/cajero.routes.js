const router = require('express').Router();
const cajeroController = require('../../controllers/cajeroController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

router.post('/venta', autenticar, autorizar('cajero', 'admin'), cajeroController.ventaRapida);
router.post('/abrir-caja', autenticar, autorizar('cajero'), cajeroController.abrirCaja);
router.post('/cerrar-caja', autenticar, autorizar('cajero'), cajeroController.cerrarCaja);
router.get('/pedidos-dia', autenticar, autorizar('cajero'), cajeroController.pedidosDelDia);

module.exports = router;