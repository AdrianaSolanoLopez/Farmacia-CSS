// src/routes/consultasClientesRoutes.js
import express from 'express';
const router = express.Router();
import * as consultasClientesController from '../controllers/consultasClientesController.js';

// Consulta de ventas por cliente
router.get('/ventas/:clienteId', consultasClientesController.obtenerVentasPorCliente);

// Consulta de devoluciones por cliente
router.get('/devoluciones/:clienteId', consultasClientesController.obtenerDevolucionesPorCliente);

export default router;
