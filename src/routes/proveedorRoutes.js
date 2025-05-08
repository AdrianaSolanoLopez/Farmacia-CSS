import express from 'express';
const router = express.Router();
import {
  obtenerProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
} from '../controllers/ProveedorController.js';

// Obtener listado de proveedores (con paginación y búsqueda)
router.get('/', obtenerProveedores);

// Obtener un proveedor específico
router.get('/:id', obtenerProveedor);

// Crear un nuevo proveedor
router.post('/', crearProveedor);

// Actualizar información de proveedor
router.put('/:id', actualizarProveedor);

// Desactivar proveedor (eliminación lógica)
router.delete('/:id', eliminarProveedor);

export default router;