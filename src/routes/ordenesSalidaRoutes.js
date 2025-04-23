//8. Rutas de Órdenes de Salida (ordenesSalidaRoutes.js)

const express = require('express');
const router = express.Router();
const ordenSalidaController = require('../controllers/ordenesSalidaController');

router.get('/', ordenSalidaController.obtenerOrdenesSalida);
router.get('/:id', ordenSalidaController.obtenerOrdenSalidaPorId);
router.post('/', ordenSalidaController.crearOrdenSalida);
router.put('/:id', ordenSalidaController.actualizarOrdenSalida);
router.delete('/:id', ordenSalidaController.eliminarOrdenSalida);

module.exports = router;
