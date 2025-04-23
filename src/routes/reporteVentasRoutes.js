//14. Rutas de Reportes Detallados de Ventas (reporteVentasRoutes.js)

const express = require('express');
const router = express.Router();
const reporteVentasController = require('../controllers/reporteVentasController');

// Cabecera de ventas
router.post('/rango', reporteVentasController.getVentasPorFecha);

// Detalle por venta específica
router.get('/detalle/:venta_id', reporteVentasController.getDetalleVenta);

module.exports = router;
