const productoController = require('../../controllers/productoController');
const productoModel = require('../../models/productoModel');

jest.mock('../../models/productoModel');

describe('Producto Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('crear producto retorna 201 y el producto creado', async () => {
    req.body = { nombre: 'Café', precio_bs: 10.5, precio_usd: 0.5, categoria: 'bebidas' };
    const productoCreado = { id: 1, ...req.body };
    productoModel.crear.mockResolvedValue(productoCreado);

    await productoController.crear(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(productoCreado);
  });
});