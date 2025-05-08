import express from 'express';
import {
  registrarDevolucion,
  getHistorialDevoluciones,
  obtenerDevolucionPorId
} from '../controllers/devolucionController.js';
import { validarDevolucion } from '../../middlewares/validacionDevoluciones.js';

const router = express.Router();

// GET /api/devoluciones
router.get('/', getHistorialDevoluciones);

// GET /api/devoluciones/:id
router.get('/:id', obtenerDevolucionPorId);

// POST /api/devoluciones
router.post('/', validarDevolucion, registrarDevolucion);

export default router;