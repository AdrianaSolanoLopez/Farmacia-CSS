import express from 'express';
import {
  registrarOrdenCompra,
  obtenerOrdenesCompra,
  obtenerOrdenPorId,
  actualizarOrdenCompra,
  eliminarOrdenCompra
} from '../controllers/ordenCompraController.js';
import { validarOrdenCompra } from '../../middlewares/validacionOrdenCompra.js';

const router = express.Router();

// GET /api/ordenes-compra
router.get('/', obtenerOrdenesCompra);

// GET /api/ordenes-compra/:id
router.get('/:id', obtenerOrdenPorId);

// POST /api/ordenes-compra
router.post('/', validarOrdenCompra, registrarOrdenCompra);

// PUT /api/ordenes-compra/:id
router.put('/:id', actualizarOrdenCompra);

// DELETE /api/ordenes-compra/:id
router.delete('/:id', eliminarOrdenCompra);

export default router;