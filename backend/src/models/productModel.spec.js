import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const mockQuery = vi.fn();

const requireC = createRequire(import.meta.url);
const dbPath = requireC.resolve('../config/db.js');
requireC.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { query: mockQuery }
};

const { getAllProducts, createProduct, updateProduct, deleteProduct } = requireC('./productModel.js');
const pool = requireC('../config/db.js');

describe('productModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('Debe consultar todos los productos activos', async () => {
      const mockProducts = [{ id: 1, name: 'Prod' }];
      pool.query.mockResolvedValue({ rows: mockProducts });

      const result = await getAllProducts();

      expect(pool.query).toHaveBeenCalled();
      const queryStr = pool.query.mock.calls[0][0];
      expect(queryStr).toContain('FROM productos');
      expect(queryStr).toContain('WHERE activo = true');
      expect(result).toEqual(mockProducts);
    });
  });

  describe('createProduct', () => {
    it('Debe insertar un nuevo producto', async () => {
      const data = {
        nombre: 'Prod',
        descripcion: 'Desc',
        categoria: 'Cat',
        unidad_base: 'kg',
        precio_compra_ves: 10,
        precio_venta_ves: 20,
        precio_venta_usd: 1,
        imagen_url: ''
      };
      const mockResult = { id_producto: 1, ...data };
      pool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await createProduct(data);

      expect(pool.query).toHaveBeenCalled();
      const queryStr = pool.query.mock.calls[0][0];
      expect(queryStr).toContain('INSERT INTO productos');
      expect(pool.query.mock.calls[0][1]).toEqual([
        data.nombre, data.descripcion, data.categoria, data.unidad_base,
        data.precio_compra_ves, data.precio_venta_ves, data.precio_venta_usd, data.imagen_url
      ]);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateProduct', () => {
    it('Debe actualizar un producto por id', async () => {
      const data = { nombre: 'Nuevo Nombre' };
      const mockResult = { id_producto: 1, nombre: 'Nuevo Nombre' };
      pool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await updateProduct(1, data);

      expect(pool.query).toHaveBeenCalled();
      const queryStr = pool.query.mock.calls[0][0];
      expect(queryStr).toContain('UPDATE productos SET');
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteProduct', () => {
    it('Debe desactivar un producto por id', async () => {
      const mockResult = { id_producto: 1, activo: false };
      pool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await deleteProduct(1);

      expect(pool.query).toHaveBeenCalled();
      const queryStr = pool.query.mock.calls[0][0];
      expect(queryStr).toContain('UPDATE productos SET activo = false WHERE id_producto = $1');
      expect(result).toEqual(mockResult);
    });
  });
});
