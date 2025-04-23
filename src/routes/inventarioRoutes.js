//5. Rutas de Inventario (inventarioRoutes.js)

const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Obtener inventario general
router.get('/', inventarioController.obtenerInventario);

// Obtener inventario por producto
router.get('/producto/:id', inventarioController.obtenerInventarioPorProducto);

// Actualizar stock manualmente (por ejemplo para ajustes)
router.put('/actualizar-stock/:id', inventarioController.actualizarStockManual);

module.exports = router;
