const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const config = require('./config/config');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', routes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`Servidor corriendo en puerto ${config.port}`);
});