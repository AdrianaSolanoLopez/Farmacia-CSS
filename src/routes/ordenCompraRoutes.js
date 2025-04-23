//7. Rutas de Órdenes de Compra (ordenCompraRoutes.js)

const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/ordenCompraController');

router.get('/', ordenCompraController.obtenerOrdenesCompra);
router.get('/:id', ordenCompraController.obtenerOrdenCompraPorId);
router.post('/', ordenCompraController.crearOrdenCompra);
router.put('/:id', ordenCompraController.actualizarOrdenCompra);
router.delete('/:id', ordenCompraController.eliminarOrdenCompra);

module.exports = router;
