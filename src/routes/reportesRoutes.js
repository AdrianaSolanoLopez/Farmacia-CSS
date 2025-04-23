//13. Rutas de Reportes Generales (reportesRoutes.js)

const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Reporte general de ventas por fechas
router.get('/ventas-por-fecha', reportesController.ventasPorFecha);

module.exports = router;
