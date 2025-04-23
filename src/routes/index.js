//routes/index.js

const express = require('express');
const router = express.Router();

// Importar cada grupo de rutas
const ajusteInventarioRoutes = require('./ajusteInventarioRoutes');
const alertasRoutes = require('./alertasRoutes');
const clienteRoutes = require('./clienteRoutes');
const configuracionRoutes = require('./configuracionRoutes');
const consultasClientesRoutes = require('./consultasClientesRoutes');
const devolucionRoutes = require('./devolucionRoutes');
const facturaRoutes = require('./facturaRoutes');
const historialCambiosRoutes = require('./historialCambiosRoutes');
const inventarioRoutes = require('./inventarioRoutes');
const ordenCompraRoutes = require('./ordenCompraRoutes');
const ordenesSalidaRoutes = require('./ordenesSalidaRoutes');
const productoRoutes = require('./productoRoutes');
const recepcionRoutes = require('./recepcionRoutes');
const reportesRoutes = require('./reportesRoutes');
const reporteVentasRoutes = require('./reporteVentasRoutes');
const ventaRoutes = require('./ventaRoutes');
const proveedorRoutes = require('./proveedorRoutes');
const autenticacionRoutes = require('./autenticacionRoutes');

// Usar las rutas bajo un prefijo opcional si deseas
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

module.exports = router;
