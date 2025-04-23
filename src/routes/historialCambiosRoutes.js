//15. Rutas de Historial de Cambios (historialCambiosRoutes.js)

const express = require('express');
const router = express.Router();
const historialCambiosController = require('../controllers/historialCambiosController');

router.get('/', historialCambiosController.obtenerHistorial);
router.post('/', historialCambiosController.registrarCambio);

module.exports = router;
