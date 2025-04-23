//11. Rutas de Facturación (facturaRoutes.js)

const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');

router.get('/', facturaController.obtenerFacturas);
router.get('/:id', facturaController.obtenerFacturaPorId);
router.post('/', facturaController.crearFactura);

module.exports = router;
