// src/routes/clientesRoutes.js
import express from 'express';
const router = express.Router();
import * as clienteController from '../controllers/clienteController.js';

router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerClientePorId);
router.post('/', clienteController.crearCliente);
router.put('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

export default router;
