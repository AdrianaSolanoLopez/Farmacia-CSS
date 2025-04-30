// src/routes/alertasRoutes.js
import express from 'express';
import { obtenerAlertas } from '../controllers/alertasController.js';  // Asegúrate de que esta función esté exportada

const router = express.Router();

// Verifica que la función `obtenerAlertas` esté definida en el controlador
router.get('/alertas', obtenerAlertas);

export default router;
