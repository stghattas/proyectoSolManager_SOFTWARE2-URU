import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const mockGetAllProducts = vi.fn();

const requireC = createRequire(import.meta.url);
const modelPath = requireC.resolve('../models/productModel.js');
requireC.cache[modelPath] = {
  id: modelPath,
  filename: modelPath,
  loaded: true,
  exports: { getAllProducts: mockGetAllProducts }
};

const { getProducts } = requireC('./productController.js');

describe('productController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('Debe obtener los productos y retornar un 200 con la lista', async () => {
      const mockProducts = [
        { id: 1, nombre: 'Producto 1' },
        { id: 2, nombre: 'Producto 2' }
      ];
      mockGetAllProducts.mockResolvedValue(mockProducts);

      await getProducts(req, res);

      expect(mockGetAllProducts).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it('Debe retornar un status 500 en caso de error en el modelo', async () => {
      mockGetAllProducts.mockRejectedValue(new Error('Error de DB'));

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener los productos' });
    });
  });
});
