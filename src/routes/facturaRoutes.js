import express from 'express';
import {
  crearFactura,
  listarFacturas,
  obtenerFacturaPorId
} from '../controllers/facturaController.js';
import { validarFactura } from '../../middlewares/validacionFacturas.js';

const router = express.Router();

// GET /api/facturas
router.get('/', listarFacturas);

// GET /api/facturas/:id
router.get('/:id', obtenerFacturaPorId);

// POST /api/facturas
router.post('/', validarFactura, crearFactura);

export default router;