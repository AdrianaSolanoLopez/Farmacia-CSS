import express from 'express';
import {
  getStockActual,
  getStockByProductoId,
  ajustarInventario,
  getHistorialAjustes
} from '../controllers/inventarioController.js';
import { validarAjusteInventario } from '../../middlewares/validacionInventario.js';

const router = express.Router();

// GET /api/inventario
router.get('/', getStockActual);

// GET /api/inventario/producto/:id
router.get('/producto/:id', getStockByProductoId);

// POST /api/inventario/ajustes
router.post('/ajustes', validarAjusteInventario, ajustarInventario);

// GET /api/inventario/ajustes/historial
router.get('/ajustes/historial', getHistorialAjustes);

export default router;