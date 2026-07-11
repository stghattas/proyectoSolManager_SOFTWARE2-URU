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

const { findUserByEmail, createUser } = requireC('./userModel.js');
const pool = requireC('../config/db.js');

describe('userModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    it('Debe llamar a pool.query con el email', async () => {
      const mockUser = { id_usuario: 1, correo: 'test@test.com' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await findUserByEmail('test@test.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM usuarios WHERE correo = $1',
        ['test@test.com']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('Debe insertar un usuario con los datos y el rol provistos', async () => {
      const mockUser = { id_usuario: 2, nombre: 'Juan', rol: 'cliente' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await createUser('juan@test.com', '123456', 'Juan', 'cliente');

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Juan', 'juan@test.com', '123456', 'cliente']
      );
      expect(result).toEqual(mockUser);
    });
  });
});
