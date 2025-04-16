const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.post('/', productoController.crearProducto);
router.get('/', productoController.listarProductos);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

// Lotes
router.post('/:producto_id/lotes', productoController.agregarLote);
router.get('/:producto_id/lotes', productoController.listarLotesPorProducto);

module.exports = router;
