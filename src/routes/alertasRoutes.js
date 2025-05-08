import express from 'express';
import {
  obtenerAlertas,
  obtenerAlertasBajoStock
} from '../controllers/alertasController.js';

const router = express.Router();

// GET /api/alertas/vencimiento
router.get('/vencimiento', obtenerAlertas);

// GET /api/alertas/stock?nivel=5 (parámetro opcional)
router.get('/stock', obtenerAlertasBajoStock);

export default router;