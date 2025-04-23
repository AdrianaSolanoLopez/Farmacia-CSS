//10. Rutas de Devoluciones (devolucionRoutes.js)

const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');

router.get('/', devolucionController.obtenerDevoluciones);
router.get('/:id', devolucionController.obtenerDevolucionPorId);
router.post('/', devolucionController.registrarDevolucion);

module.exports = router;
