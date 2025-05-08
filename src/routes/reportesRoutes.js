import express from 'express';
const router = express.Router();
import {
  ventasPorFecha,
  resumenVentasPorFecha
} from '../controllers/reportesController.js';

// Reporte detallado de ventas por fechas
router.get('/ventas', ventasPorFecha);

// Reporte resumido de ventas por fechas
router.get('/ventas/resumen', resumenVentasPorFecha);

export default router;