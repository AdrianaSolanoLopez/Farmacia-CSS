import express from 'express';
import {
  obtenerHistorial,
  registrarCambio
} from '../controllers/historialCambiosController.js';
import { validarRegistroCambio } from '../../middlewares/validacionHistorial.js';

const router = express.Router();

// GET /api/historial-cambios
router.get('/', obtenerHistorial);

// POST /api/historial-cambios
router.post('/', validarRegistroCambio, registrarCambio);

export default router;