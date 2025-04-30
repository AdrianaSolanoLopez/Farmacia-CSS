// src/routes/clientesRoutes.js

import express from 'express';
import ClienteController from '../controllers/clientesController.js';  // Asegúrate de importar correctamente el controlador

const router = express.Router();

// Rutas de los clientes
router.get('/', ClienteController.obtenerClientes);
router.get('/:id', ClienteController.obtenerClientePorId);
router.post('/', ClienteController.crearCliente);
router.put('/:id', ClienteController.actualizarCliente);
router.delete('/:id', ClienteController.eliminarCliente);

export default router;
