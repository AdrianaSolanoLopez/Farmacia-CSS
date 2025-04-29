// src/routes/facturaRoutes.js
import express from 'express';
const router = express.Router();
import * as facturaController from '../controllers/facturaController.js';

router.get('/', facturaController.obtenerFacturas);
router.get('/:id', facturaController.obtenerFacturaPorId);
router.post('/', facturaController.crearFactura);

export default router;
