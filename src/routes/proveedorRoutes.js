// src/routes/proveedorRoutes.js
import express from 'express';
const router = express.Router();
import * as proveedorController from '../controllers/ProveedorController.js';

router.get('/', proveedorController.obtenerProveedores);
router.get('/:id', proveedorController.obtenerProveedor);
router.post('/', proveedorController.crearProveedor);
router.put('/:id', proveedorController.actualizarProveedor);
router.delete('/:id', proveedorController.eliminarProveedor);

export default router;
