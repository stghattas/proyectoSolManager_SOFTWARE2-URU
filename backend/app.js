// 1. Cargar módulos
const express = require('express');
const cors = require('cors');
const http = require('http');

const config = require('./config/config');
const routes = require('./routes');
const setupWebSocket = require('./websocket');

// 2. Crear la app Express
const app = express();

// 3. Middlewares globales
app.use(cors());
app.use(express.json());

// 4. Rutas API
app.use('/api', routes);

// 5. Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// 6. Crear servidor HTTP a partir de la app Express
const server = http.createServer(app);

// 7. Inicializar WebSocket sobre el mismo servidor
setupWebSocket(server);

// 8. Iniciar el servidor
server.listen(config.port, () => {
  console.log(`Servidor corriendo en puerto ${config.port}`);
  console.log(`WebSocket disponible en ws://localhost:${config.port}/ws`);
});