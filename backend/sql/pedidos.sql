module.exports = {
  crearPedido: `
  INSERT INTO pedidos (usuario_id, cajero_id, direccion_entrega_id, estado_id,
    subtotal_bs, subtotal_usd, descuento_bs, descuento_usd,
    impuesto_bs, impuesto_usd, total_bs, total_usd, metodo_pago, datos_pago, comentario)
  VALUES ($1,$2,$3,(SELECT id FROM estados_pedido WHERE nombre='pendiente'),
    $4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
`,
  crearItem: `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, unidad_id, precio_unitario_bs, precio_unitario_usd, subtotal_bs, subtotal_usd) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
  listarPorUsuario: `SELECT p.*, e.nombre as estado FROM pedidos p JOIN estados_pedido e ON p.estado_id = e.id WHERE p.usuario_id = $1 ORDER BY fecha_pedido DESC`,
  obtenerPorId: `SELECT p.*, e.nombre as estado, u.nombre as cliente_nombre FROM pedidos p JOIN estados_pedido e ON p.estado_id = e.id JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1`,
  obtenerItems: `SELECT pi.*, pr.nombre as producto_nombre FROM pedido_items pi JOIN productos pr ON pi.producto_id = pr.id WHERE pi.pedido_id = $1`,
  actualizarEstado: `UPDATE pedidos SET estado_id = (SELECT id FROM estados_pedido WHERE nombre=$1) WHERE id=$2`,
  asignarRepartidor: `UPDATE pedidos SET repartidor_id = $1 WHERE id = $2`,
  ventasDiarias: `SELECT COUNT(*), SUM(total_bs) FROM pedidos WHERE fecha_pedido::date = CURRENT_DATE AND estado_id = (SELECT id FROM estados_pedido WHERE nombre='entregado')`,
  // Para cajero: pedidos del día
  pedidosDelDia: `SELECT p.*, e.nombre as estado FROM pedidos p JOIN estados_pedido e ON p.estado_id = e.id WHERE p.fecha_pedido::date = CURRENT_DATE ORDER BY fecha_pedido DESC`
};