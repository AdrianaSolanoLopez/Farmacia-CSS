// src/routes/authRoutes.js
import express from 'express';
const router = express.Router();
import * as authController from '../controllers/AutenticacionController.js';

// Login
router.post('/login', authController.login);

// Registrar usuario (opcional, si se maneja desde backend)
router.post('/register', authController.register);

export default router;
