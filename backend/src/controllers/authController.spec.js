import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

// Preparar mocks y forzar que el controlador (CJS) use estas implementaciones
const mockFindUserByEmail = vi.fn()
const mockCreateUser = vi.fn()

// Datos generales de prueba (cambiar aquí para probar con otro gmail/pwd)
const TEST_EMAIL = 'ronald@gmailcom'
const TEST_PWD = ''

// Reemplazar el módulo CJS en el cache de require antes de cargar el controlador
const requireC = createRequire(import.meta.url)
const userModelPath = requireC.resolve('../models/userModel.js')
requireC.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: { findUserByEmail: mockFindUserByEmail, createUser: mockCreateUser }
}

// Mockear jsonwebtoken (CJS) también via require cache
const jwtPath = requireC.resolve('jsonwebtoken')
requireC.cache[jwtPath] = {
  id: jwtPath,
  filename: jwtPath,
  loaded: true,
  exports: { sign: vi.fn(() => 'signed-token') }
}

// Importar el controlador CJS usando createRequire para garantizar que use nuestros mocks
const { login, register } = requireC('./authController.js')

// Helper para simular el objeto response (Express)
const mockResponse = () => {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

afterEach(() => {
  delete process.env.JWT_SECRET
})

/**
 * Organización solicitada:
 * - `describe` principal para el controlador
 * - `describe` secundarios por endpoint (`login`, `register`)
 * - dentro de cada uno, `describe` para grupos de casos y `it` con entrada/salida
 */



describe('Controlador de autenticación', () => {

  describe('login', () => {

    
    describe('Validaciones de entrada', () => {
      it('1) Debe retornar 400 si faltan email o contraseña - Entrada/Salida', async () => {
        // Entrada:
        const req = { body: { email: TEST_EMAIL, password: undefined } } // falta password
        const res = mockResponse()

        // Act
        await login(req, res)

        // Salida esperada:
        // status 400 { message: 'Faltan el correo o la contraseña' }
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Faltan el correo o la contraseña' })
      })
    })

    describe('Errores de autenticación', () => {
      it('2) Debe retornar 401 si el usuario no existe - Entrada/Salida', async () => {
        // Entrada:
        mockFindUserByEmail.mockResolvedValue(null)
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD } }
        const res = mockResponse()

        // Act
        await login(req, res)

        // Salida esperada: status 401 + mensaje de credenciales
        expect(mockFindUserByEmail).toHaveBeenCalledWith(TEST_EMAIL)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales incorrectas' })
      })

      it('3) Debe retornar 401 si la contraseña es incorrecta - Entrada/Salida', async () => {
        // Entrada:
        const fakeUser = { id_usuario: 1, correo: TEST_EMAIL, contraseña: 'secret' }
        mockFindUserByEmail.mockResolvedValue(fakeUser)
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD } }
        const res = mockResponse()

        // Act
        await login(req, res)

        // Salida esperada: status 401 + mensaje de credenciales
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales incorrectas' })
      })
    })

    describe('Autenticación exitosa', () => {
      it('4) Debe retornar token y datos de usuario en caso de éxito - Entrada/Salida', async () => {
        // Entrada:
        const fakeUser = {
          id_usuario: 2,
          correo: TEST_EMAIL,
          contraseña: TEST_PWD,
          nombre: 'Usuario OK',
          rol: 'cliente'
        }
        mockFindUserByEmail.mockResolvedValue(fakeUser)
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD } }
        const res = mockResponse()

        // Act
        await login(req, res)

        // Salida esperada: JSON con token y user
        expect(res.json).toHaveBeenCalledWith({
          accessToken: 'signed-token',
          user: {
            id: fakeUser.id_usuario,
            email: fakeUser.correo,
            name: fakeUser.nombre,
            role: fakeUser.rol
          }
        })
      })
    })
  })

  describe('register', () => {
    describe('Validaciones de entrada', () => {
      it('5) Debe retornar 400 si faltan campos obligatorios - Entrada/Salida', async () => {
        // Entrada:
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD } } // falta name
        const res = mockResponse()

        // Act
        await register(req, res)

        // Salida esperada: status 400 + mensaje
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Todos los campos son obligatorios' })
      })

      it('6) Debe retornar 400 si el rol no es válido - Entrada/Salida', async () => {
        // Entrada:
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD, name: 'X', role: 'admin' } }
        const res = mockResponse()

        // Act
        await register(req, res)

        // Salida esperada: status 400 + mensaje rol
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Rol no válido' })
      })
    })

    describe('Conflictos y errores', () => {
      it('7) Debe retornar 409 si el correo ya está registrado - Entrada/Salida', async () => {
        // Entrada:
        const existing = { id_usuario: 5, correo: TEST_EMAIL }
        mockFindUserByEmail.mockResolvedValue(existing)
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD, name: 'Dup' } }
        const res = mockResponse()

        // Act
        await register(req, res)

        // Salida esperada: status 409 + mensaje
        expect(mockFindUserByEmail).toHaveBeenCalledWith(TEST_EMAIL)
        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({ message: 'El correo ya está registrado' })
      })
    })

    describe('Registro exitoso', () => {
      it('8) Debe crear usuario y retornar token + usuario en caso de éxito - Entrada/Salida', async () => {
        // Entrada:
        mockFindUserByEmail.mockResolvedValue(null)
        const created = {
          id_usuario: 77,
          correo: TEST_EMAIL,
          nombre: 'Nuevo',
          rol: 'cliente'
        }
        mockCreateUser.mockResolvedValue(created)
        const req = { body: { email: TEST_EMAIL, password: TEST_PWD, name: 'Nuevo' } }
        const res = mockResponse()

        // Act
        await register(req, res)

        // Salida esperada: status 201 + JSON con token y user
        expect(mockCreateUser).toHaveBeenCalledWith(TEST_EMAIL, TEST_PWD, 'Nuevo', 'cliente')
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith({
          accessToken: 'signed-token',
          user: {
            id: created.id_usuario,
            email: created.correo,
            name: created.nombre,
            role: created.rol
          }
        })
      })
    })
  })
})
