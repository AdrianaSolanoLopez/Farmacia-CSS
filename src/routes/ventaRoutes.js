// src/routes/ventaRoutes.js
import express from 'express';
const router = express.Router();
import * as ventaController from '../controllers/ventaController.js';

router.get('/', ventaController.getHistorialVentas);
router.get('/:id', ventaController.getDetalleVenta);
router.post('/', ventaController.registrarVenta);
//router.get('/fecha', ventaController.getVentasPorFecha);
//router.delete('/:id', ventaController.eliminarVenta);

export default router;
