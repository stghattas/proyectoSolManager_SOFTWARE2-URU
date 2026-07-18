const authController = require('../../controllers/authController');
const usuarioModel = require('../../models/usuarioModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../models/usuarioModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('login exitoso retorna token y datos del usuario', async () => {
    req.body = { email: 'test@example.com', password: '123456' };
    const fakeUser = {
      id: 1,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      rol: 'cliente',
      password_hash: 'hashedPassword',
    };
    usuarioModel.buscarPorEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake-token');

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: 'fake-token',
      user: {
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        rol: 'cliente',
      },
    });
  });
});