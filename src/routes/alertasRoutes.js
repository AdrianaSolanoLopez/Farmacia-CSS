// src/routes/alertasRoutes.js
import express from 'express';
const router = express.Router();
import * as alertasController from '../controllers/alertasController.js';

// Productos por vencer próximamente
router.get('/productos-proximos-a-vencer', alertasController.productosProximosAVencer);

// Productos vencidos
router.get('/productos-vencidos', alertasController.productosVencidos);

export default router;
