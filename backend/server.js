const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const warehouseRoutes = require('./src/routes/warehouse');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/products', productRoutes); // para clientes (solo lectura)
app.use('/warehouse', warehouseRoutes); // para almacenista y admin

app.get('/', (req, res) => {
  res.json({ message: '🚀 API Sol-Manager funcionando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});