import express from 'express';
const router = express.Router();
import {
  getVentasPorFecha,
  getDetalleVenta,
  getTopProductos
} from '../controllers/reporteVentasController.js';

// Reporte completo de ventas por rango de fechas
router.post('/ventas/rango', getVentasPorFecha);

// Detalle de una venta específica
router.get('/ventas/detalle/:venta_id', getDetalleVenta);

// Top 10 productos más vendidos en un rango
router.post('/ventas/top-productos', getTopProductos);

export default router;