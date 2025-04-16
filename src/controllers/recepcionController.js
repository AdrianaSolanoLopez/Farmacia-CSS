//recepcionController.js

const sql = require('mssql');
const AppError = require('../utils/AppError');
const { executeStoredProcedure } = require('../database/db');

// Función para crear el acta de recepción
const createActa = async (req, res, next) => {
  const { fecha_recepcion, ciudad, Responsable, numero_factura, detalles } = req.body;

  // Validación de entrada
  if (!fecha_recepcion || !ciudad || !Responsable || !numero_factura) {
    return next(new AppError('Faltan campos requeridos para la creación del acta', 400));
  }

  try {
    // Ejecutar procedimiento para crear el acta
    const result = await executeStoredProcedure('sp_GuardarActa', [
      { name: 'fecha_recepcion', type: sql.DateTime, value: fecha_recepcion },
      { name: 'ciudad', type: sql.NVarChar, value: ciudad },
      { name: 'Responsable', type: sql.NVarChar, value: Responsable },
      { name: 'numero_factura', type: sql.NVarChar, value: numero_factura },
      { name: 'detalles', type: sql.NVarChar, value: detalles }
    ]);

    if (!result || !result.recordset) {
      console.error('Error en el procedimiento sp_GuardarActa: Sin respuesta de la base de datos');
      throw new AppError('Error al crear el acta: No se recibió respuesta del procedimiento', 500);
    }

    // Responder con éxito
    res.status(201).json({
      success: true,
      message: 'Acta creada exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en la creación del acta:', error);
    next(new AppError(error.message || 'Error al crear el acta', 500));
  }
};

// Función para agregar productos al acta
const addProductsToActa = async (req, res, next) => {
  const { acta_id, productos } = req.body;

  // Validación de entrada
  if (!acta_id || !productos || productos.length === 0) {
    return next(new AppError('Faltan datos necesarios: acta_id o productos', 400));
  }

  try {
    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Iterar sobre los productos y agregar al acta
      for (const item of productos) {
        await transaction.request().execute('sp_AgregarProductoActa', [
          { name: 'acta_id', type: sql.Int, value: acta_id },
          { name: 'producto_id', type: sql.Int, value: item.producto_id },
          { name: 'cantidad', type: sql.Int, value: item.cantidad },
          { name: 'precio', type: sql.Float, value: item.precio }
        ]);
      }

      // Confirmar transacción
      await transaction.commit();
      res.status(201).json({
        success: true,
        message: 'Productos agregados exitosamente al acta'
      });
    } catch (error) {
      // Si ocurre un error, revertir transacción
      await transaction.rollback();
      console.error('Error en la inserción de productos:', error);
      return next(new AppError('Error al agregar productos al acta', 500));
    }
  } catch (error) {
    console.error('Error en la transacción de productos:', error);
    next(new AppError(error.message || 'Error al procesar los productos', 500));
  }
};

// Función para buscar productos en la base de datos
const searchProduct = async (req, res, next) => {
  const { busqueda } = req.query;

  // Validación de entrada
  if (!busqueda) {
    return next(new AppError('El término de búsqueda es obligatorio', 400));
  }

  try {
    // Ejecutar búsqueda
    const result = await executeStoredProcedure('sp_BuscarProducto', [
      { name: 'busqueda', type: sql.NVarChar, value: busqueda }
    ]);

    if (!result || !result.recordset) {
      return next(new AppError('No se encontraron productos', 404));
    }

    // Responder con los resultados
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en la búsqueda de productos:', error);
    next(new AppError('Error al buscar productos', 500));
  }
};

// Función para cargar el acta en el inventario
const loadActaToInventory = async (req, res, next) => {
  const { acta_id } = req.body;

  // Validación de entrada
  if (!acta_id) {
    return next(new AppError('El acta_id es obligatorio', 400));
  }

  try {
    // Verificar si el acta existe
    const acta = await executeStoredProcedure('sp_GetActaById', [
      { name: 'acta_id', type: sql.Int, value: acta_id }
    ]);

    if (!acta || !acta.recordset.length) {
      return next(new AppError('Acta no encontrada', 404));
    }

    // Ejecutar procedimiento para cargar productos en el inventario
    const result = await executeStoredProcedure('sp_CargarActaInventario', [
      { name: 'acta_id', type: sql.Int, value: acta_id }
    ]);

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Acta cargada al inventario exitosamente',
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al cargar el acta en el inventario:', error);
    next(new AppError('Error al cargar el acta en el inventario', 500));
  }
};

module.exports = {
  createActa,
  addProductsToActa,
  searchProduct,
  loadActaToInventory
};
