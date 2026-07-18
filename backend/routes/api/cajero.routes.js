const express = require('express');
const router = express.Router();
const cajeroController = require('../../controllers/cajeroController');
const pedidoModel = require('../../models/pedidoModel'); // Necesario para la ruta de reimpresión
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

// Punto de venta y caja
router.post('/venta', autenticar, autorizar('cajero', 'admin'), cajeroController.ventaRapida);
router.post('/abrir-caja', autenticar, autorizar('cajero'), cajeroController.abrirCaja);
router.post('/cerrar-caja', autenticar, autorizar('cajero'), cajeroController.cerrarCaja);
router.get('/pedidos-dia', autenticar, autorizar('cajero'), cajeroController.pedidosDelDia);

// Clientes
router.get('/clientes', autenticar, autorizar('cajero', 'admin'), cajeroController.listarClientes);
router.get('/clientes/:id/pedidos', autenticar, autorizar('cajero', 'admin'), cajeroController.pedidosDeCliente);
router.post('/personas', autenticar, autorizar('cajero', 'admin'), cajeroController.crearPersona);
router.post('/crear-usuario', autenticar, autorizar('cajero', 'admin'), cajeroController.crearUsuarioCompleto);

// Reimpresión y anulación
router.get('/pedido/:id', autenticar, autorizar('cajero', 'admin'), cajeroController.obtenerPedido);
router.put('/pedido/:id/anular', autenticar, autorizar('cajero', 'admin'), cajeroController.anularPedido);

router.delete('/persona/:id', autenticar, autorizar('cajero', 'admin'), cajeroController.eliminarPersona);

module.exports = router;