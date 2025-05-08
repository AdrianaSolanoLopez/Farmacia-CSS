import express from 'express';
import {
  obtenerConfiguracion,
  actualizarConfiguracion
} from '../controllers/configuracionController.js'; // Importación nombrada

const router = express.Router();

// Usa las funciones importadas directamente
router.get('/', obtenerConfiguracion);
router.put('/', actualizarConfiguracion);

export default router;