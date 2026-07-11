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

const { createProduct, getAlmacenes, createProveedor } = requireC('./adminController.js');
const pool = requireC('../config/db.js');

describe('adminController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('Debe crear un producto y retornar 201', async () => {
      req.body = {
        nombre: 'Prod Test',
        descripcion: 'Test',
        categoria: 'Cat',
        unidad_base: 'kg',
        precio_compra_ves: 10,
        precio_venta_ves: 20,
        imagen_url: ''
      };
      
      const fakeProduct = { id_producto: 1, ...req.body };
      pool.query.mockResolvedValue({ rows: [fakeProduct] });

      await createProduct(req, res);

      expect(pool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeProduct);
    });

    it('Debe retornar 500 en caso de error en la consulta', async () => {
      pool.query.mockRejectedValue(new Error('DB Error'));

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error al crear producto' });
    });
  });

  describe('getAlmacenes', () => {
    it('Debe retornar la lista de almacenes', async () => {
      const mockAlmacenes = [{ id_almacen: 1, nombre: 'Principal' }];
      pool.query.mockResolvedValue({ rows: mockAlmacenes });

      await getAlmacenes(req, res);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM Almacen ORDER BY id_almacen');
      expect(res.json).toHaveBeenCalledWith(mockAlmacenes);
    });
  });

  describe('createProveedor', () => {
    it('Debe crear un proveedor y retornar 201', async () => {
      req.body = {
        rif: 'J-12345678-9',
        razon_social: 'Proveedor C.A.',
        direccion: 'Calle 1',
        telefono: '0414',
        contacto_nombre: 'Juan'
      };
      
      const fakeProveedor = { id_proveedor: 1, ...req.body };
      pool.query.mockResolvedValue({ rows: [fakeProveedor] });

      await createProveedor(req, res);

      expect(pool.query).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeProveedor);
    });
  });
});
