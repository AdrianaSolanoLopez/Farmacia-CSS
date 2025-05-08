import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createLote,
  getLotesByProductId,
  getLotesPorVencer
} from '../controllers/productoController.js';
import { validarProducto, validarLote } from '../../middlewares/validacionProductos.js';

const router = express.Router();

// Productos
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', validarProducto, createProduct);
router.put('/:id', validarProducto, updateProduct);
router.delete('/:id', deleteProduct);

// Lotes
router.get('/:producto_id/lotes', getLotesByProductId);
router.post('/:producto_id/lotes', validarLote, createLote);

// Alertas
router.get('/alertas/vencimientos', getLotesPorVencer);

export default router;