const { getStockMovements, createStockMovement, updateStockQuantity, getStockByProductAndWarehouse } = require('../models/stockModel');
const { createPurchase, getPurchases, getPurchaseDetails } = require('../models/purchaseModel');
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../models/productModel');
const { getWarehouses, createWarehouse } = require('../models/warehouseModel');
const { getSuppliers, createSupplier } = require('../models/supplierModel');

// ==== PRODUCTOS ====
const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

const createProductCtrl = async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

const updateProductCtrl = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await updateProduct(id, req.body);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

const deleteProductCtrl = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await deleteProduct(id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto desactivado', producto: product });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    res.status(500).json({ message: 'Error al desactivar producto' });
  }
};

// ==== ALMACENES ====
const getWarehousesCtrl = async (req, res) => {
  try {
    const warehouses = await getWarehouses();
    res.json(warehouses);
  } catch (error) {
    console.error('Error al obtener almacenes:', error);
    res.status(500).json({ message: 'Error al obtener almacenes' });
  }
};

const createWarehouseCtrl = async (req, res) => {
  try {
    const warehouse = await createWarehouse(req.body);
    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Error al crear almacén:', error);
    res.status(500).json({ message: 'Error al crear almacén' });
  }
};

// ==== PROVEEDORES ====
const getSuppliersCtrl = async (req, res) => {
  try {
    const suppliers = await getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
};

const createSupplierCtrl = async (req, res) => {
  try {
    const supplier = await createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
};

// ==== MOVIMIENTOS ====
const getMovements = async (req, res) => {
  try {
    const movements = await getStockMovements();
    res.json(movements);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ message: 'Error al obtener movimientos de stock' });
  }
};

// ==== AJUSTES DE STOCK ====
const registerAdjustment = async (req, res) => {
  const { id_producto, id_almacen, tipo, cantidad, descripcion } = req.body;
  const id_usuario = req.user.id;

  if (!id_producto || !id_almacen || !tipo || cantidad === undefined) {
    return res.status(400).json({ message: 'Faltan datos para el ajuste' });
  }

  try {
    const stock = await getStockByProductAndWarehouse(id_producto, id_almacen);
    if (!stock) {
      return res.status(404).json({ message: 'No se encontró stock para ese producto y almacén' });
    }

    let nuevaCantidad;
    if (['compra', 'ajuste_inventario_fisico', 'devolucion_cliente'].includes(tipo)) {
      nuevaCantidad = parseFloat(stock.cantidad_actual) + parseFloat(cantidad);
    } else if (['venta', 'devolucion_proveedor', 'ajuste_perdida'].includes(tipo)) {
      nuevaCantidad = parseFloat(stock.cantidad_actual) - parseFloat(cantidad);
      if (nuevaCantidad < 0) {
        return res.status(400).json({ message: 'La cantidad resultante no puede ser negativa' });
      }
    } else {
      return res.status(400).json({ message: 'Tipo de movimiento no válido para ajuste manual' });
    }

    // Actualizar stock
    const updatedStock = await updateStockQuantity(stock.id_stock, nuevaCantidad);

    // Registrar movimiento
    const movement = await createStockMovement(
      stock.id_stock,
      tipo,
      cantidad,
      descripcion || 'Ajuste manual',
      id_usuario
    );

    res.status(201).json({
      message: 'Ajuste registrado correctamente',
      stock: updatedStock,
      movimiento: movement
    });
  } catch (error) {
    console.error('Error en ajuste de stock:', error);
    res.status(500).json({ message: 'Error al registrar el ajuste de stock' });
  }
};

// ==== COMPRAS ====
const registerPurchase = async (req, res) => {
  const { id_proveedor, id_almacen_destino, numero_factura_proveedor, fecha_compra, detalles } = req.body;
  const id_usuario = req.user.id;
  const id_empleado = req.user.id; // asumiendo que el usuario es empleado

  if (!id_proveedor || !id_almacen_destino || !numero_factura_proveedor || !fecha_compra || !detalles || detalles.length === 0) {
    return res.status(400).json({ message: 'Faltan datos para la compra' });
  }

  let total_ves = 0;
  let total_usd = 0;
  for (const det of detalles) {
    total_ves += det.cantidad * det.precio_unitario_ves;
    total_usd += det.cantidad * det.precio_unitario_usd;
  }

  try {
    const purchaseData = {
      id_proveedor,
      id_empleado,
      id_almacen_destino,
      numero_factura_proveedor,
      fecha_compra,
      total_compra_ves: total_ves,
      total_compra_usd: total_usd
    };
    const newPurchase = await createPurchase(purchaseData, detalles);

    // Actualizar stock para cada producto
    for (const det of detalles) {
      const stock = await getStockByProductAndWarehouse(det.id_producto, id_almacen_destino);
      if (stock) {
        const nuevaCantidad = parseFloat(stock.cantidad_actual) + parseFloat(det.cantidad);
        await updateStockQuantity(stock.id_stock, nuevaCantidad);
        await createStockMovement(
          stock.id_stock,
          'compra',
          det.cantidad,
          `Compra factura ${numero_factura_proveedor}`,
          id_usuario
        );
      } else {
        return res.status(404).json({ message: `Stock no encontrado para producto ${det.id_producto} en el almacén seleccionado` });
      }
    }

    res.status(201).json({
      message: 'Compra registrada correctamente',
      compra: newPurchase
    });
  } catch (error) {
    console.error('Error al registrar compra:', error);
    res.status(500).json({ message: 'Error al registrar la compra de mercancía' });
  }
};

const getPurchasesList = async (req, res) => {
  try {
    const purchases = await getPurchases();
    res.json(purchases);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ message: 'Error al obtener las compras' });
  }
};

const getPurchaseDetailsById = async (req, res) => {
  const { id } = req.params;
  try {
    const details = await getPurchaseDetails(id);
    res.json(details);
  } catch (error) {
    console.error('Error al obtener detalles de compra:', error);
    res.status(500).json({ message: 'Error al obtener los detalles de la compra' });
  }
};

module.exports = {
  getProducts,
  createProductCtrl,
  updateProductCtrl,
  deleteProductCtrl,
  getWarehousesCtrl,
  createWarehouseCtrl,
  getSuppliersCtrl,
  createSupplierCtrl,
  getMovements,
  registerAdjustment,
  registerPurchase,
  getPurchasesList,
  getPurchaseDetailsById
};