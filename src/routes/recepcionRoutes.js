//9. Rutas de Recepción de Productos (recepcionRoutes.js)

const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcionController');

router.get('/', recepcionController.obtenerRecepciones);
router.get('/:id', recepcionController.obtenerRecepcionPorId);
router.post('/', recepcionController.registrarRecepcion);

module.exports = router;
