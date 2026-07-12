const router = require('express').Router();
const productoController = require('../../controllers/productoController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

router.get('/', productoController.listar);
router.get('/:id', productoController.obtener);
router.post('/', autenticar, autorizar('admin', 'gerente', 'almacenista'), productoController.crear);
router.put('/:id', autenticar, autorizar('admin', 'gerente', 'almacenista'), productoController.actualizar);
router.delete('/:id', autenticar, autorizar('admin', 'gerente'), productoController.eliminar);

module.exports = router;