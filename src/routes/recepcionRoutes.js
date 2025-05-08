import express from 'express';
import {
  obtenerRecepciones,
  obtenerRecepcionPorId,
  registrarRecepcion,
  createActa,
  addProductsToActa,
  searchProduct,
  loadActaToInventory
} from '../controllers/recepcionController.js';

const router = express.Router();

// Rutas básicas
router.get('/', obtenerRecepciones);
router.get('/:id', obtenerRecepcionPorId);
router.post('/', registrarRecepcion);

// Rutas específicas para funcionalidades
router.post('/acta', createActa);
router.post('/productos', addProductsToActa);
router.get('/productos/buscar', searchProduct);
router.post('/inventario', loadActaToInventory);

export default router;