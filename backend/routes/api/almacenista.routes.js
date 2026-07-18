const router = require('express').Router();
const almacenistaController = require('../../controllers/almacenistaController');
const autenticar = require('../../middleware/autenticacion');
const autorizar = require('../../middleware/autorizacion');

router.post('/movimiento', autenticar, autorizar('almacenista','admin'), almacenistaController.movimientos);
router.get('/alertas-stock', autenticar, autorizar('almacenista','admin'), almacenistaController.alertasStock);
router.post('/compras', autenticar, autorizar('almacenista','admin'), almacenistaController.comprasProveedor);
router.get('/almacenes', autenticar, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM almacenes WHERE activo = true');
  res.json(rows);
});
router.get('/movimientos', autenticar, autorizar('almacenista','admin'), almacenistaController.listarMovimientos);
module.exports = router;