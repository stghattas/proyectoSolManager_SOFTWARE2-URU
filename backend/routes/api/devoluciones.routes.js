const express = require('express');
const router = express.Router();
const devolucionController = require('../../controllers/devolucionController');
const autenticar = require('../../middleware/autenticacion');

router.post('/devolucion', autenticar, devolucionController.solicitarDevolucion);
router.get('/devoluciones', autenticar, devolucionController.misDevoluciones);

module.exports = router;