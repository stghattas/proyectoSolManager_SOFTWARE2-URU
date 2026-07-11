const express = require('express');
const { getProducts } = require('../controllers/productController');
const verifyToken = require('../middlewares/auth');
const router = express.Router();

router.get('/', verifyToken, getProducts);

module.exports = router;