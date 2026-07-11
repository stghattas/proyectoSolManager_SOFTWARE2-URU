import { describe, it, expect, vi, beforeEach } from 'vitest';
import { allowRoles, isAdmin, isAlmacenistaOrAdmin } from './roles';

describe('Roles Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  describe('allowRoles', () => {
    it('Debe retornar 401 si no hay usuario autenticado (req.user undefinido)', () => {
      const middleware = allowRoles(['admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No autenticado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe retornar 403 si el rol del usuario no está autorizado', () => {
      req.user = { role: 'cliente' };
      const middleware = allowRoles(['admin', 'gerente']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acceso denegado: rol no autorizado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe llamar a next() si el rol del usuario está en la lista de permitidos', () => {
      req.user = { role: 'admin' };
      const middleware = allowRoles(['admin', 'gerente']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('Debe permitir a admin y gerente', () => {
      req.user = { role: 'admin' };
      isAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('Debe denegar a cliente', () => {
      req.user = { role: 'cliente' };
      isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('isAlmacenistaOrAdmin', () => {
    it('Debe permitir a almacenista', () => {
      req.user = { role: 'almacenista' };
      isAlmacenistaOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('Debe permitir a admin', () => {
      req.user = { role: 'admin' };
      isAlmacenistaOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('Debe denegar a cliente', () => {
      req.user = { role: 'cliente' };
      isAlmacenistaOrAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
