//16. Rutas de Configuración del Sistema (configuracionRoutes.js)

const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

router.get('/', configuracionController.obtenerConfiguracion);
router.put('/', configuracionController.actualizarConfiguracion);

module.exports = router;
