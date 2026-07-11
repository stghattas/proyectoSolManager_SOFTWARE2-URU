module.exports = {
  stockPorAlmacen: `SELECT ia.*, p.nombre as producto, a.nombre as almacen FROM inventario_almacen ia JOIN productos p ON ia.producto_id = p.id JOIN almacenes a ON ia.almacen_id = a.id WHERE ia.almacen_id = $1`,
  registrarMovimiento: `INSERT INTO movimientos_inventario (producto_id, almacen_id, tipo, cantidad, unidad_id, usuario_id, referencia, motivo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
  actualizarStock: `
    INSERT INTO inventario_almacen (almacen_id, producto_id, cantidad)
    VALUES ($1,$2,$3)
    ON CONFLICT (almacen_id, producto_id)
    DO UPDATE SET cantidad = inventario_almacen.cantidad + $3, actualizado_en = NOW()
  `,
  productosBajoStock: `SELECT ia.*, p.nombre, p.stock_minimo FROM inventario_almacen ia JOIN productos p ON ia.producto_id = p.id WHERE ia.cantidad <= p.stock_minimo`
};