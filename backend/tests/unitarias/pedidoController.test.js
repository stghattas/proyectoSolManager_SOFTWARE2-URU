const pedidoController = require('../../controllers/pedidoController');

jest.mock('../../models/pedidoModel');
jest.mock('../../models/productoModel');

describe('Pedido Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, usuario: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('crear pedido sin items o metodo_pago retorna 400', async () => {
    req.body = {}; // sin items ni metodo_pago

    await pedidoController.crear(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Faltan items o método de pago' });
  });
});