// src/routes/historialCambiosRoutes.js
import express from 'express';
const router = express.Router();
import * as historialCambiosController from '../controllers/historialCambiosController.js';

router.get('/', historialCambiosController.obtenerHistorial);
router.post('/', historialCambiosController.registrarCambio);

export default router;
