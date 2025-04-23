//18. Rutas de Alertas (alertasRoutes.js)

const express = require('express');
const router = express.Router();
const alertasController = require('../controllers/alertasController');

// Productos por vencer próximamente
router.get('/productos-proximos-a-vencer', alertasController.productosProximosAVencer);

// Productos vencidos
router.get('/productos-vencidos', alertasController.productosVencidos);

module.exports = router;
