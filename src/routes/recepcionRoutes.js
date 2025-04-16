import express from 'express';
import { body } from 'express-validator';
import {
  searchProduct,
  createActa,
  addProductsToActa,
  getActaProducts,
  editActaProduct,
  deleteActaProduct,
  loadActaToInventory,
  listActas, 
  updateActaObservations
} from '../controllers/recepcionController.js';

const router = express.Router();

// Rutas para la gestión de productos
router.get('/products/search', searchProduct); // Buscar productos por nombre o código de barras

// Rutas para la gestión de actas
router.get('/', listActas); // Llamar a la función listActas
router.post('/',
  [
    body('tipo_acta').notEmpty().withMessage('El tipo de acta es obligatorio'),
    body('numero_factura').notEmpty().withMessage('El número de factura es obligatorio'),
    body('proveedor').notEmpty().withMessage('El proveedor es obligatorio'),
    body('fecha_recepcion').isDate().withMessage('La fecha de recepción debe ser una fecha válida'),
    body('ciudad').notEmpty().withMessage('La ciudad es obligatoria'),
    body('Responsable').notEmpty().withMessage('El Responsable es obligatorio'),
  ],
  createActa
);

router.post('/:acta_id/products',
  [
    body('productos').isArray({ min: 1 }).withMessage('Debe proporcionar una lista de productos')
  ],
  addProductsToActa
);

router.get('/:acta_id/products', getActaProducts); // Consultar productos de un acta

router.patch('/:acta_id/products/:producto_id',
  [
    body('nombre_producto').notEmpty().withMessage('El nombre del producto es obligatorio'),
    body('fecha_vencimiento').isDate().withMessage('La fecha de vencimiento debe ser válida')
  ],
  editActaProduct
);

router.delete('/:acta_id/products/:acta_producto_id', deleteActaProduct); // Eliminar un producto del acta

router.patch('/:acta_id/observations', updateActaObservations); // Actualizar observaciones de un acta

router.post('/:acta_id/inventory', loadActaToInventory); // Cargar acta al inventario



export default router;
