// src/routes/ajusteInventarioRoutes.js
import express from 'express';
const router = express.Router();
import * as ajusteController from '../controllers/ajusteInventarioController.js';

router.get('/', ajusteController.obtenerAjustes);
router.post('/', ajusteController.registrarAjuste);

export default router;
