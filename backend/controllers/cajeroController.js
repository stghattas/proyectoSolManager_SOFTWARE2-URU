const pedidoModel = require('../models/pedidoModel');
const productoModel = require('../models/productoModel');
const cajaModel = require('../models/cajaModel');
const pool = require('../config/database');

exports.ventaRapida = async (req, res) => {
  try {
    const { items, metodo_pago, datos_pago, comentario } = req.body;
    if (!items || !metodo_pago) {
      return res.status(400).json({ error: 'Items y método de pago son requeridos' });
    }

    // Obtener precios reales de los productos
    const ids = items.map(i => i.producto_id);
    const productos = await productoModel.obtenerVarios(ids);
    const prodMap = {};
    productos.forEach(p => { prodMap[p.id] = p; });

    let subtotal_bs = 0, subtotal_usd = 0;
    const itemsProcesados = [];

    for (const item of items) {
      const prod = prodMap[item.producto_id];
      if (!prod) return res.status(400).json({ error: `Producto ${item.producto_id} no encontrado` });
      const cantidad = item.cantidad || 1;
      const precio_bs = parseFloat(prod.precio_bs);
      const precio_usd = parseFloat(prod.precio_usd);
      const sub_bs = precio_bs * cantidad;
      const sub_usd = precio_usd * cantidad;
      subtotal_bs += sub_bs;
      subtotal_usd += sub_usd;

      itemsProcesados.push({
        producto_id: prod.id,
        cantidad,
        unidad_id: prod.unidad_medida_base_id,
        precio_unitario_bs: precio_bs,
        precio_unitario_usd: precio_usd,
        subtotal_bs: sub_bs,
        subtotal_usd: sub_usd,
      });
    }

    const total_bs = subtotal_bs;
    const total_usd = subtotal_usd;

    // Crear el pedido (sin cliente, con cajero)
    const pedido = await pedidoModel.crear({
      usuario_id: null,            // venta directa sin cliente
      cajero_id: req.usuario.id,
      direccion_entrega_id: null,
      subtotal_bs,
      subtotal_usd,
      descuento_bs: 0,
      descuento_usd: 0,
      impuesto_bs: 0,
      impuesto_usd: 0,
      total_bs,
      total_usd,
      metodo_pago,
      datos_pago: datos_pago || {},
      comentario: comentario || '',
      items: itemsProcesados,
    });

    res.status(201).json(pedido);
  } catch (error) {
    console.error(error);
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
    // Se podría calcular diferencia con ventas del día, pero por ahora simple
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