//4. Rutas de Productos (productosRoutes.js)

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProductoPorId);
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

// Lotes relacionados
router.get('/:id/lotes', productoController.obtenerLotesPorProducto);
router.post('/:id/lotes', productoController.agregarLoteAProducto);

// Productos por vencer
router.get('/alertas/vencimientos', productoController.productosProximosAVencer);

module.exports = router;
