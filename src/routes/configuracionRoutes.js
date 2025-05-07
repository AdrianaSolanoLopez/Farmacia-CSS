// src/routes/configuracionRoutes.js
import express from 'express';
import * as configuracionController from '../controllers/configuracionController.js';

const router = express.Router();

// Obtener configuración general del sistema
router.get('/', configuracionController.obtenerConfiguracion);

// Actualizar configuración general del sistema
router.put('/', configuracionController.actualizarConfiguracion);

export default router;
