import express from 'express';
import {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
} from '../controllers/clienteController.js';

const router = express.Router();

// Ruta base: /api/clientes (definido en app.js)
router.get('/', obtenerClientes);          // GET /api/clientes?estado=activo
router.get('/:id', obtenerClientePorId);   // GET /api/clientes/123
router.post('/', crearCliente);            // POST /api/clientes
router.put('/:id', actualizarCliente);     // PUT /api/clientes/123
router.delete('/:id', eliminarCliente);    // DELETE /api/clientes/123

export default router;