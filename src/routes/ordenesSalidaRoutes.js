// src/routes/ordenesSalidaRoutes.js
import express from 'express';
const router = express.Router();
import * as ordenesSalidaController from '../controllers/ordenesSalidaController.js';

router.get('/', ordenesSalidaController.obtenerOrdenesSalida);
//router.get('/:id', ordenesSalidaController.obtenerOrdenSalidaPorId);
router.post('/', ordenesSalidaController.registrarOrdenSalida);
//router.put('/:id', ordenesSalidaController.actualizarOrdenSalida);
//router.delete('/:id', ordenesSalidaController.eliminarOrdenSalida);

export default router;
