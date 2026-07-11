import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const requireC = createRequire(import.meta.url);

const mockJwtVerify = vi.fn();
const jwtPath = requireC.resolve('jsonwebtoken');
requireC.cache[jwtPath] = {
  id: jwtPath,
  filename: jwtPath,
  loaded: true,
  exports: { verify: mockJwtVerify }
};

const verifyToken = requireC('./auth.js');

describe('verifyToken Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  it('Debe retornar 401 si no se proporciona el token', () => {
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Debe retornar 401 si el header de autorizacion no empieza con Bearer', () => {
    req.headers.authorization = 'Basic somerandomtoken';
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Debe retornar 401 si el token es inválido o expira', () => {
    req.headers.authorization = 'Bearer invalid_token';
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    verifyToken(req, res, next);

    expect(mockJwtVerify).toHaveBeenCalledWith('invalid_token', 'test_secret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Debe llamar a next() y asignar req.user si el token es válido', () => {
    const fakeDecodedUser = { id: 1, role: 'admin' };
    req.headers.authorization = 'Bearer valid_token';
    mockJwtVerify.mockReturnValue(fakeDecodedUser);

    verifyToken(req, res, next);

    expect(mockJwtVerify).toHaveBeenCalledWith('valid_token', 'test_secret');
    expect(req.user).toEqual(fakeDecodedUser);
    expect(next).toHaveBeenCalled();
  });
});
