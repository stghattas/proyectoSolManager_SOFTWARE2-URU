const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const autenticar = require('../../middleware/autenticacion');

router.post('/register', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', autenticar, authController.perfil);        // nuevo
router.put('/perfil', autenticar, authController.actualizarPerfil); // nuevo
router.put('/cambiar-password', autenticar, authController.cambiarPassword); // nuevo

module.exports = router;