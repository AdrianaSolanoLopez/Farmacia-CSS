import express from 'express';
import {
  obtenerClientePorDocumento,
  historialCompras,
  historialDevoluciones
} from '../controllers/consultasClientesController.js';

const router = express.Router();

// Documento debe ser string (cédula/nit/pasaporte)
router.get('/documento/:documento', obtenerClientePorDocumento);

// ID debe ser numérico
router.get('/:clienteId/compras', historialCompras);
router.get('/:clienteId/devoluciones', historialDevoluciones);

export default router;