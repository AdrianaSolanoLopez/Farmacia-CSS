import express from 'express';
import {
  obtenerAjustes,
  registrarAjuste
} from '../controllers/ajusteInventarioController.js';
//import { validarDatosAjuste } from '../middlewares/validacionAjustes.js'; // Opcional

const router = express.Router();

// Ruta base: /api/ajustes-inventario (se define en app.js)
router.get('/', obtenerAjustes);
router.post('/',
  // validarDatosAjuste, // Middleware opcional para validación
  registrarAjuste
);

export default router;