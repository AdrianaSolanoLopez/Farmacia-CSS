//17. Rutas de Consultas de Clientes (consultasClientesRoutes.js)

const express = require('express');
const router = express.Router();
const consultasClientesController = require('../controllers/consultasClientesController');

// Consulta de ventas por cliente
router.get('/ventas/:clienteId', consultasClientesController.obtenerVentasPorCliente);

// Consulta de devoluciones por cliente
router.get('/devoluciones/:clienteId', consultasClientesController.obtenerDevolucionesPorCliente);

module.exports = router;
