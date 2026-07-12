const pedidoModel = require('../models/pedidoModel');
const productoModel = require('../models/productoModel');

exports.crear = async (req, res) => {
  try {
    const { items, metodo_pago, direccion_entrega_id, datos_pago, comentario } = req.body;
    if (!items || !metodo_pago) {
      return res.status(400).json({ error: 'Faltan items o método de pago' });
    }

    // Obtener precios actuales desde la base de datos
    const productosIds = items.map(i => i.producto_id);
    const productos = await productoModel.obtenerVarios(productosIds);

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

    const descuento_bs = 0, descuento_usd = 0;
    const impuesto_bs = 0, impuesto_usd = 0;
    const total_bs = subtotal_bs + impuesto_bs - descuento_bs;
    const total_usd = subtotal_usd + impuesto_usd - descuento_usd;

    const pedido = await pedidoModel.crear({
      usuario_id: req.usuario.id,
      cajero_id: null,
      direccion_entrega_id: direccion_entrega_id || null,
      subtotal_bs,
      subtotal_usd,
      descuento_bs,
      descuento_usd,
      impuesto_bs,
      impuesto_usd,
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

exports.misPedidos = async (req, res) => {
  try {
    const pedidos = await pedidoModel.listarPorUsuario(req.usuario.id);
    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerDetalle = async (req, res) => {
  try {
    const pedido = await pedidoModel.obtener(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
exports.factura = async (req, res) => {
  try {
    const pedido = await pedidoModel.obtener(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    // Asegurarse de que el usuario autenticado es dueño del pedido o admin
    if (pedido.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};