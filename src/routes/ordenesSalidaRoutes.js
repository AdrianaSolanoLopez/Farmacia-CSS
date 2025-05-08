import express from 'express';
import {
  registrarOrdenSalida,
  obtenerOrdenesSalida,
  obtenerOrdenSalidaPorId,
  actualizarOrdenSalida,
  eliminarOrdenSalida
} from '../controllers/ordenesSalidaController.js';
import { validarOrdenSalida } from '../../middlewares/validacionOrdenSalida.js';

const router = express.Router();

// GET /api/ordenes-salida
router.get('/', obtenerOrdenesSalida);

// GET /api/ordenes-salida/:id
router.get('/:id', obtenerOrdenSalidaPorId);

// POST /api/ordenes-salida
router.post('/', validarOrdenSalida, registrarOrdenSalida);

// PUT /api/ordenes-salida/:id
router.put('/:id', actualizarOrdenSalida);

// DELETE /api/ordenes-salida/:id
router.delete('/:id', eliminarOrdenSalida);

export default router;