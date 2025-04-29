// src/routes/inventarioRoutes.js
import express from 'express';
const router = express.Router();
import * as inventarioController from '../controllers/inventarioController.js';

// Obtener inventario general
router.get('/', inventarioController.getStockActual);

// Obtener inventario por producto
router.get('/producto/:id', inventarioController.getStockByProductoId);

// Actualizar stock manualmente (por ejemplo para ajustes)
router.put('/actualizar-stock/:id', inventarioController.ajustarInventario);

export default router;
