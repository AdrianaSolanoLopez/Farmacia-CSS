import express from 'express';
const router = express.Router();
import {
  registrarVenta,
  getHistorialVentas,
  getDetalleVenta,
  getVentasPorFecha,
  eliminarVenta
} from '../controllers/ventaController.js';

// Registrar nueva venta
router.post('/', registrarVenta);

// Obtener historial de ventas (con paginación)
router.get('/', getHistorialVentas);

// Obtener detalle de una venta específica
router.get('/:id', getDetalleVenta);

// Obtener ventas por rango de fechas
router.get('/reporte/por-fecha', getVentasPorFecha);

// Eliminar una venta (revertir stock)
router.delete('/:id', eliminarVenta);

export default router;