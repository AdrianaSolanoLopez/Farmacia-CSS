// src/routes/ordenCompraRoutes.js
import express from 'express';
const router = express.Router();
import * as ordenCompraController from '../controllers/ordenCompraController.js';

router.get('/', ordenCompraController.obtenerOrdenesCompra);
router.get('/:id', ordenCompraController.obtenerOrdenPorId);
router.post('/', ordenCompraController.registrarOrdenCompra);
//router.put('/:id', ordenCompraController.actualizarOrdenCompra);
//router.delete('/:id', ordenCompraController.eliminarOrdenCompra);

export default router;
