// src/routes/reportesRoutes.js
import express from 'express';
const router = express.Router();
import * as reportesController from '../controllers/reportesController.js';

// Reporte general de ventas por fechas
router.get('/ventas-por-fecha', reportesController.ventasPorFecha);

export default router;
