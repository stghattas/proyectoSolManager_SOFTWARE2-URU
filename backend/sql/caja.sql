module.exports = {
  abrirCaja: `INSERT INTO cierres_caja (cajero_id, monto_inicial_bs, monto_inicial_usd) VALUES ($1,$2,$3) RETURNING *`,
  cerrarCaja: `UPDATE cierres_caja SET fecha_cierre = NOW(), monto_final_bs = $2, monto_final_usd = $3, diferencia_bs = $4, diferencia_usd = $5, comentario = $6 WHERE id = $1`,
  cajaAbierta: `SELECT * FROM cierres_caja WHERE cajero_id = $1 AND fecha_cierre IS NULL ORDER BY fecha_apertura DESC LIMIT 1`,
  registrarVenta: `INSERT INTO pedidos (cajero_id, estado_id, subtotal_bs, subtotal_usd, total_bs, total_usd, metodo_pago, datos_pago) VALUES ($1,(SELECT id FROM estados_pedido WHERE nombre='entregado'),$2,$3,$4,$5,$6,$7) RETURNING *`
};