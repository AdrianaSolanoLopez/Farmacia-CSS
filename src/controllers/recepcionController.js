import sql from 'mssql';
import { executeStoredProcedure } from '../../config/db.js';
import { AppError } from '../../middlewares/errorHandler.js';


// Buscar un producto por nombre o código de barras
export const searchProduct = async (req, res, next) => {
  try {
    const { busqueda } = req.query;

    const result = await executeStoredProcedure('sp_searchProduct', [
      { name: 'busqueda', type: sql.NVarChar, value: busqueda }
    ]);

    res.status(200).json(result.recordset);
  } catch (error) {
    next(new AppError('Error al buscar el producto', 500));
  }
};

// Crear un acta de recepción
export const createActa = async (req, res, next) => {
  try {
    const { 
      fecha_recepcion, 
      ciudad, 
      Responsable, 
      numero_factura, 
      proveedor, 
      tipo_acta, 
      observaciones 
    } = req.body;

    // Insertar acta usando el procedimiento almacenado
    const result = await executeStoredProcedure('sp_GuardarActa', [
      { name: 'fecha_recepcion', type: sql.Date, value: new Date(fecha_recepcion) },
      { name: 'ciudad', type: sql.NVarChar, value: ciudad },
      { name: 'Responsable', type: sql.NVarChar, value: Responsable },
      { name: 'numero_factura', type: sql.NVarChar, value: numero_factura },
      { name: 'proveedor', type: sql.NVarChar, value: proveedor },
      { name: 'tipo_acta', type: sql.NVarChar, value: tipo_acta },
      { name: 'observaciones', type: sql.NVarChar, value: observaciones || null }
    ]);

    // Verificar si el procedimiento se ejecutó correctamente
    if (result && result.recordset) {
      res.status(201).json({
        message: 'Acta creada exitosamente',
        acta: result.recordset[0]
      });
    } else {
      throw new AppError('Error al crear el acta: No se recibió respuesta del procedimiento', 500);
    }
  } catch (error) {
    console.error('Error detallado:', error);
    next(new AppError(error.message || 'Error al crear el acta', 500));
  }
};


// Agregar productos a un acta existente
// src/server/controllers/recepcionController.js

export const addProductsToActa = async (req, res, next) => {
  try {
    const { acta_id } = req.params;
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos)) {
      throw new AppError('No se proporcionaron productos válidos', 400);
    }

    for (const item of productos) {
      const producto = item.producto;

      // Validamos que existan los campos requeridos
      if (!producto.nombre_producto || !producto.lote_id || !producto.cantidad_recibida) {
        throw new AppError('Faltan campos requeridos en el producto', 400);
      }

      await executeStoredProcedure('sp_AgregarProductoActa', [
        { name: 'acta_id', type: sql.Int, value: parseInt(acta_id) },
        { name: 'nombre_producto', type: sql.NVarChar, value: producto.nombre_producto },
        { name: 'concentracion', type: sql.NVarChar, value: producto.concentracion || null },
        { name: 'forma_farmaceutica', type: sql.NVarChar, value: producto.forma_farmaceutica || null },
        { name: 'presentacion', type: sql.NVarChar, value: producto.presentacion },
        { name: 'laboratorio', type: sql.NVarChar, value: producto.laboratorio },
        { name: 'registro_sanitario', type: sql.NVarChar, value: producto.registro_sanitario },
        { name: 'temperatura_id', type: sql.Int, value: producto.temperatura_id }, 
        { name: 'codigo_barras', type: sql.NVarChar, value: producto.codigo_barras || null },
        { name: 'categoria', type: sql.NVarChar, value: producto.categoria || 'MEDICAMENTO' },
        { name: 'lote_id', type: sql.NVarChar, value: producto.lote_id },
        { name: 'fecha_vencimiento', type: sql.Date, value: new Date(producto.fecha_vencimiento) },
        { name: 'cantidad_recibida', type: sql.Int, value: producto.cantidad_recibida },
        { name: 'precio_compra', type: sql.Decimal, value: producto.precio_compra },
        { name: 'observaciones', type: sql.NVarChar, value: producto.observaciones || null }
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Productos agregados exitosamente al acta'
    });
  } catch (error) {
    console.error('Error detallado:', error);
    next(new AppError(error.message || 'Error al agregar productos al acta', error.statusCode || 500));
  }
};


// Consultar productos de un acta
export const getActaProducts = async (req, res, next) => {
  try {
    const { acta_id } = req.params;

    const result = await executeStoredProcedure('sp_VerProductosActa', [
      { name: 'acta_id', type: sql.Int, value: acta_id }
    ]);

    res.status(200).json(result.recordset);
  } catch (error) {
    next(new AppError('Error al consultar los productos del acta', 500));
  }
};

// Editar un producto del acta
export const editActaProduct = async (req, res, next) => {
  try {
    const { acta_id, producto_id } = req.params;
    const { 
      nombre_producto, concentracion, forma_farmaceutica, presentacion, laboratorio, 
      temperatura_id, codigo_barras, categoria, lote_id, fecha_vencimiento, 
      cantidad_recibida, precio_compra, observaciones, registro_sanitario 
    } = req.body;

await executeStoredProcedure('sp_EditarProductoActa', [
  { name: 'acta_id', type: sql.Int, value: acta_id },
  { name: 'producto_id', type: sql.Int, value: producto_id },
  { name: 'nombre_producto', type: sql.NVarChar, value: nombre_producto || null },
  { name: 'concentracion', type: sql.NVarChar, value: concentracion || null },
  { name: 'forma_farmaceutica', type: sql.NVarChar, value: forma_farmaceutica || null },
  { name: 'presentacion', type: sql.NVarChar, value: presentacion || null },
  { name: 'laboratorio', type: sql.NVarChar, value: laboratorio || null },
  { name: 'temperatura_id', type: sql.Int, value: temperatura_id || null },
  { name: 'codigo_barras', type: sql.NVarChar, value: codigo_barras || null },
  { name: 'categoria', type: sql.NVarChar, value: categoria || null },
  { name: 'lote_id', type: sql.NVarChar, value: lote_id || null },
  { name: 'fecha_vencimiento', type: sql.Date, value: fecha_vencimiento || null },
  { name: 'cantidad_recibida', type: sql.Int, value: cantidad_recibida || null },
  { name: 'precio_compra', type: sql.Decimal, value: precio_compra || null },
  { name: 'observaciones', type: sql.NVarChar, value: observaciones || null },
  { name: 'registro_sanitario', type: sql.NVarChar, value: registro_sanitario || null }
]);

    res.status(200).json({ message: 'Producto editado exitosamente' });
  } catch (error) {
    next(new AppError('Error al editar el producto del acta', 500));
  }
};

// Eliminar un producto del acta
export const deleteActaProduct = async (req, res, next) => {
  try {
    const { acta_producto_id } = req.params;

    await executeStoredProcedure('sp_EliminarProductoActa', [
      { name: 'acta_producto_id', type: sql.Int, value: acta_producto_id }
    ]);

    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    next(new AppError('Error al eliminar el producto del acta', 500));
  }
};

// Cargar un acta al inventario
export const loadActaToInventory = async (req, res, next) => {
  try {
    const { acta_id } = req.params;

    await executeStoredProcedure('sp_CargarActaInventario', [
      { name: 'acta_id', type: sql.Int, value: acta_id }
    ]);

    res.status(200).json({ message: 'Acta cargada al inventario exitosamente' });
  } catch (error) {
    next(new AppError('Error al cargar el acta al inventario', 500));
  }
};

// Listar actas con filtros opcionales
export const listActas = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, Responsable, numero_factura, proveedor, tipo_acta } = req.query;

    // Convertir fechas a formato SQL si están presentes
    const startDate = fecha_inicio ? new Date(fecha_inicio) : null;
    const endDate = fecha_fin ? new Date(fecha_fin) : null;

    const result = await executeStoredProcedure('sp_ListarActas', [
      { name: 'fecha_inicio', type: sql.Date, value: startDate },
      { name: 'fecha_fin', type: sql.Date, value: endDate },
      { name: 'Responsable', type: sql.NVarChar, value: Responsable || null },
      { name: 'numero_factura', type: sql.NVarChar, value: numero_factura || null },
      { name: 'proveedor', type: sql.NVarChar, value: proveedor || null },
      { name: 'tipo_acta', type: sql.NVarChar, value: tipo_acta || null }
    ]);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al listar las actas:', error);
    next(new AppError('Error al listar las actas', 500));
  }
};

// Actualizar las observaciones de un acta
export const updateActaObservations = async (req, res, next) => {
  try {
    const { acta_id } = req.params;
    const { observaciones } = req.body;

    await executeStoredProcedure('sp_UpdateActaObservations', [
      { name: 'acta_id', type: sql.Int, value: acta_id },
      { name: 'observaciones', type: sql.NVarChar(sql.MAX), value: observaciones }
    ]);

    res.status(200).json({ message: 'Observaciones actualizadas exitosamente' });
  } catch (error) {
    next(new AppError('Error al actualizar las observaciones', 500));
  }
};