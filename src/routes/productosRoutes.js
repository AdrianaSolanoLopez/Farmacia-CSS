// src/routes/productosRoutes.js
import express from 'express';
const router = express.Router();
import * as productoController from '../controllers/productoController.js';

router.get('/', productoController.getAllProducts);
router.get('/:id', productoController.getProductById);
router.post('/', productoController.createProduct);
router.put('/:id', productoController.updateProduct);
router.delete('/:id', productoController.deleteProduct);

// Lotes relacionados
//router.get('/:id/lotes', productoController.obtenerLotesPorProducto);
//router.post('/:id/lotes', productoController.agregarLoteAProducto);

// Productos por vencer
//router.get('/alertas/vencimientos', productoController.productosProximosAVencer);

export default router;
