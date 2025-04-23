// 1. Rutas de Autenticación (authRoutes.js)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/AutenticacionController');

// Login
router.post('/login', authController.login);

// Registrar usuario (opcional, si se maneja desde backend)
router.post('/register', authController.register);

module.exports = router;

