// src/routes/configuracionRoutes.js
import express from 'express';
const router = express.Router();
import * as configuracionController from '../controllers/configuracionController.js';

router.get('/', configuracionController.obtenerConfiguracion);
router.put('/', configuracionController.actualizarConfiguracion);

export default router;
