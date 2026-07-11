const pedidoModel = require('../models/pedidoModel');
const cajaModel = require('../models/cajaModel');

exports.ventaRapida = async (req, res) => {
  try {
    // Similar a crear pedido pero con cajero_id = req.usuario.id y estado "entregado"
    const pedido = await pedidoModel.crear({ ...req.body, cajero_id: req.usuario.id });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.abrirCaja = async (req, res) => {
  try {
    const { inicial_bs, inicial_usd } = req.body;
    const caja = await cajaModel.abrirCaja(req.usuario.id, inicial_bs, inicial_usd);
    res.json(caja);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cerrarCaja = async (req, res) => {
  try {
    const { caja_id, final_bs, final_usd, comentario } = req.body;
    // Calcular diferencia con total de ventas del día...
    await cajaModel.cerrarCaja(caja_id, final_bs, final_usd, 0, 0, comentario);
    res.json({ message: 'Caja cerrada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.pedidosDelDia = async (req, res) => {
  try {
    const pedidos = await pedidoModel.pedidosDelDia();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};