const request = require('supertest');
const express = require('express');
const app = express();
const routes = require('../../routes');

app.use(express.json());
app.use('/api', routes);

describe('Auth Routes - Integration Tests', () => {
  let token;
  // Genera un email único para evitar conflictos con ejecuciones anteriores
  const testEmail = `ana_${Date.now()}@test.com`;

  test('POST /api/auth/register - registro exitoso', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Ana',
        apellido: 'Pérez',
        email: testEmail,
        password: 'secreto123',
        rol: 'cliente',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Usuario creado exitosamente');
    expect(res.body.usuario).toHaveProperty('email', testEmail);
  });

  test('POST /api/auth/login - login exitoso', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'secreto123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testEmail);
    token = res.body.token; // guardamos para la siguiente prueba
  });

  test('GET /api/auth/perfil - obtener perfil con token', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', testEmail);
  });
});