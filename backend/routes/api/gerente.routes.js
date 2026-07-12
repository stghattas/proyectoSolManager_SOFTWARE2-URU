const router = require('express').Router();
const gerenteController = require('../../controllers/gerenteController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

router.get('/usuarios', autenticar, autorizar('gerente','admin'), gerenteController.listarUsuarios);
router.post('/usuarios', autenticar, autorizar('gerente','admin'), gerenteController.crearUsuario);
router.get('/reportes/ventas', autenticar, autorizar('gerente','admin'), gerenteController.reportesVentas);

module.exports = router;