// src/routes/index.js
import express from 'express';

import ajusteInventarioRoutes from './ajusteInventarioRoutes.js';
import alertasRoutes from './alertasRoutes.js';
import clienteRoutes from './clientesRoutes.js';
import configuracionRoutes from './configuracionRoutes.js';
import consultasClientesRoutes from './consultasClientesRoutes.js';
import devolucionRoutes from './devolucionRoutes.js';
import facturaRoutes from './facturaRoutes.js';
import historialCambiosRoutes from './historialCambiosRoutes.js';
import inventarioRoutes from './inventarioRoutes.js';
import ordenCompraRoutes from './ordenCompraRoutes.js';
import ordenesSalidaRoutes from './ordenesSalidaRoutes.js';
import productoRoutes from './productosRoutes.js';
import recepcionRoutes from './recepcionRoutes.js';
import reportesRoutes from './reportesRoutes.js';
import reporteVentasRoutes from './reporteVentasRoutes.js';
import ventaRoutes from './ventaRoutes.js';
import proveedorRoutes from './proveedorRoutes.js';
import autenticacionRoutes from './authRoutes.js';

const router = express.Router();

router.use('/ajustes-inventario', ajusteInventarioRoutes);
router.use('/alertas', alertasRoutes);
router.use('/clientes', clienteRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/consultas-clientes', consultasClientesRoutes);
router.use('/devoluciones', devolucionRoutes);
router.use('/facturas', facturaRoutes);
router.use('/historial-cambios', historialCambiosRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/ordenes-compra', ordenCompraRoutes);
router.use('/ordenes-salida', ordenesSalidaRoutes);
router.use('/productos', productoRoutes);
router.use('/recepciones', recepcionRoutes);
router.use('/reportes', reportesRoutes);
router.use('/reporte-ventas', reporteVentasRoutes);
router.use('/ventas', ventaRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/auth', autenticacionRoutes);

export default router;
