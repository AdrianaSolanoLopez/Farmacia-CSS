//12. Rutas de Ventas (ventaRoutes.js)

const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.get('/', ventaController.obtenerVentas);
router.get('/:id', ventaController.obtenerVentaPorId);
router.post('/', ventaController.registrarVenta);

module.exports = router;
