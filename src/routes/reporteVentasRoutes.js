// src/routes/reporteVentasRoutes.js
import express from 'express';
const router = express.Router();
import * as reporteVentasController from '../controllers/reporteVentasController.js';

// Cabecera de ventas
router.post('/rango', reporteVentasController.getVentasPorFecha);

// Detalle por venta específica
router.get('/detalle/:venta_id', reporteVentasController.getDetalleVenta);

export default router;
