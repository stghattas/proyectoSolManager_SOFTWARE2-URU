const pool = require('../config/db');

// ===== PRODUCTOS =====
const createProduct = async (req, res) => {
  const { nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, imagen_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Producto (nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, imagen_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, imagen_url, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Producto SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        categoria = COALESCE($3, categoria),
        unidad_base = COALESCE($4, unidad_base),
        precio_compra_ves = COALESCE($5, precio_compra_ves),
        precio_venta_ves = COALESCE($6, precio_venta_ves),
        imagen_url = COALESCE($7, imagen_url),
        activo = COALESCE($8, activo)
       WHERE id_producto = $9 RETURNING *`,
      [nombre, descripcion, categoria, unidad_base, precio_compra_ves, precio_venta_ves, imagen_url, activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // Desactivar en lugar de eliminar físicamente
    const result = await pool.query(
      `UPDATE Producto SET activo = false WHERE id_producto = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto desactivado', producto: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al desactivar producto' });
  }
};

// ===== ALMACENES =====
const getAlmacenes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Almacen ORDER BY id_almacen');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener almacenes' });
  }
};

const createAlmacen = async (req, res) => {
  const { nombre, ubicacion, tipo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Almacen (nombre, ubicacion, tipo) VALUES ($1, $2, $3) RETURNING *`,
      [nombre, ubicacion, tipo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear almacén' });
  }
};

// ===== PROVEEDORES =====
const getProveedores = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Proveedor WHERE activo = true ORDER BY razon_social');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
};

const createProveedor = async (req, res) => {
  const { rif, razon_social, direccion, telefono, contacto_nombre } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Proveedor (rif, razon_social, direccion, telefono, contacto_nombre)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [rif, razon_social, direccion, telefono, contacto_nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAlmacenes,
  createAlmacen,
  getProveedores,
  createProveedor
};