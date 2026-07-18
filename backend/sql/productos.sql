module.exports = {
  listarTodos: `
    SELECT p.*, u.abreviatura as unidad_abreviatura
    FROM productos p
    JOIN unidades_medida u ON p.unidad_medida_base_id = u.id
    WHERE p.activo = true
    ORDER BY p.nombre
  `,
  buscarPorCategoria: `
    SELECT p.*, u.abreviatura as unidad_abreviatura
    FROM productos p
    JOIN unidades_medida u ON p.unidad_medida_base_id = u.id
    WHERE p.categoria_id = $1 AND p.activo = true
    ORDER BY p.nombre
  `,
  buscarPorNombre: `
    SELECT p.*, u.abreviatura as unidad_abreviatura
    FROM productos p
    JOIN unidades_medida u ON p.unidad_medida_base_id = u.id
    WHERE p.nombre ILIKE '%' || $1 || '%' AND p.activo = true
  `,
  obtenerPorId: `
    SELECT p.*, u.abreviatura as unidad_abreviatura
    FROM productos p
    JOIN unidades_medida u ON p.unidad_medida_base_id = u.id
    WHERE p.id = $1
  `,
  crear: `INSERT INTO productos (nombre, descripcion, categoria_id, precio_bs, precio_usd, unidad_medida_base_id, codigo_barras, stock_minimo, imagen_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
  actualizar: `UPDATE productos SET nombre=$1, descripcion=$2, precio_bs=$3, precio_usd=$4, unidad_medida_base_id=$5, categoria_id=$6, imagen_url=$7 WHERE id=$8 RETURNING *`,
  deshabilitar: `UPDATE productos SET activo = false WHERE id = $1`
};