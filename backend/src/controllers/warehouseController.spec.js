import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const mockGetAllProducts = vi.fn();
const mockGetStockMovements = vi.fn();
const mockGetStockByProductAndWarehouse = vi.fn();
const mockUpdateStockQuantity = vi.fn();
const mockCreateStockMovement = vi.fn();

const requireC = createRequire(import.meta.url);

const pModelPath = requireC.resolve('../models/productModel.js');
requireC.cache[pModelPath] = {
  id: pModelPath,
  filename: pModelPath,
  loaded: true,
  exports: { getAllProducts: mockGetAllProducts }
};

const sModelPath = requireC.resolve('../models/stockModel.js');
requireC.cache[sModelPath] = {
  id: sModelPath,
  filename: sModelPath,
  loaded: true,
  exports: { 
    getStockMovements: mockGetStockMovements,
    getStockByProductAndWarehouse: mockGetStockByProductAndWarehouse,
    updateStockQuantity: mockUpdateStockQuantity,
    createStockMovement: mockCreateStockMovement
  }
};

const purModelPath = requireC.resolve('../models/purchaseModel.js');
requireC.cache[purModelPath] = {
  id: purModelPath,
  filename: purModelPath,
  loaded: true,
  exports: {} // No test requires purchaseModel methods right now
};
const wModelPath = requireC.resolve('../models/warehouseModel.js');
requireC.cache[wModelPath] = {
  id: wModelPath,
  filename: wModelPath,
  loaded: true,
  exports: {}
};
const supModelPath = requireC.resolve('../models/supplierModel.js');
requireC.cache[supModelPath] = {
  id: supModelPath,
  filename: supModelPath,
  loaded: true,
  exports: {}
};

const { getProducts, getMovements, registerAdjustment } = requireC('./warehouseController.js');

describe('warehouseController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { user: { id: 1 }, body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('Debe retornar productos a través de productModel', async () => {
      const mockProducts = [{ id: 1, name: 'Prod A' }];
      mockGetAllProducts.mockResolvedValue(mockProducts);

      await getProducts(req, res);

      expect(mockGetAllProducts).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });
  });

  describe('getMovements', () => {
    it('Debe retornar los movimientos de stock', async () => {
      const mockMoves = [{ id_movimiento: 1, tipo: 'compra' }];
      mockGetStockMovements.mockResolvedValue(mockMoves);

      await getMovements(req, res);

      expect(mockGetStockMovements).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockMoves);
    });
  });

  describe('registerAdjustment', () => {
    it('Debe fallar si faltan datos', async () => {
      req.body = { id_producto: 1 }; // Faltan datos

      await registerAdjustment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Faltan datos para el ajuste' });
    });

    it('Debe registrar ajuste de stock (compra / ingreso) correctamente', async () => {
      req.body = {
        id_producto: 1,
        id_almacen: 1,
        tipo: 'compra',
        cantidad: 10,
        descripcion: 'Ingreso manual'
      };
      const mockStock = { id_stock: 1, cantidad_actual: 5 };
      mockGetStockByProductAndWarehouse.mockResolvedValue(mockStock);
      mockUpdateStockQuantity.mockResolvedValue({ ...mockStock, cantidad_actual: 15 });
      mockCreateStockMovement.mockResolvedValue({ id_movimiento: 1 });

      await registerAdjustment(req, res);

      expect(mockGetStockByProductAndWarehouse).toHaveBeenCalledWith(1, 1);
      expect(mockUpdateStockQuantity).toHaveBeenCalledWith(1, 15);
      expect(mockCreateStockMovement).toHaveBeenCalledWith(1, 'compra', 10, 'Ingreso manual', 1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Ajuste registrado correctamente'
      }));
    });
  });
});
