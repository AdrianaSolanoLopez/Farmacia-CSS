// src/routes/ajusteInventarioRoutes.js
import express from 'express';
import { obtenerAjustes, registrarAjuste } from '../controllers/ajusteInventarioController.js';

const router = express.Router();

router.get('/ajustes', obtenerAjustes);
router.post('/ajustes', registrarAjuste);

export default router;  // Exportación por defecto del enrutador
