//6. Rutas de Ajustes de Inventario (ajusteInventarioRoutes.js)

const express = require('express');
const router = express.Router();
const ajusteController = require('../controllers/ajusteInventarioController');

router.get('/', ajusteController.obtenerAjustes);
router.post('/', ajusteController.registrarAjuste);

module.exports = router;
