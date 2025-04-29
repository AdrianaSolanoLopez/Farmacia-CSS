// src/routes/devolucionRoutes.js
import express from 'express';
const router = express.Router();
import * as devolucionController from '../controllers/devolucionController.js';

router.get('/', devolucionController.obtenerDevoluciones);
router.get('/:id', devolucionController.obtenerDevolucionPorId);
router.post('/', devolucionController.registrarDevolucion);

export default router;
