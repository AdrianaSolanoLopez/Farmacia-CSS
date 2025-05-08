import { executeQuery, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';

// Función para crear el acta de recepción
export const createActa = async (req, res, next) => {
  const { fecha_recepcion, ciudad, Responsable, numero_factura, detalles } = req.body;

  // Validación de entrada
  if (!fecha_recepcion || !ciudad || !Responsable || !numero_factura) {
    return next(new AppError('Faltan campos requeridos para la creación del acta', 400));
  }

  try {
    // Ejecutar procedimiento para crear el acta
    const result = await executeQuery(
      `EXEC sp_GuardarActa 
       @fecha_recepcion = @fecha, 
       @ciudad = @ciudad, 
       @Responsable = @responsable, 
       @numero_factura = @factura, 
       @detalles = @detalles`,
      [
        { name: 'fecha', type: sql.DateTime, value: fecha_recepcion },
        { name: 'ciudad', type: sql.NVarChar, value: ciudad },
        { name: 'responsable', type: sql.NVarChar, value: Responsable },
        { name: 'factura', type: sql.NVarChar, value: numero_factura },
        { name: 'detalles', type: sql.NVarChar, value: detalles }
      ]
    );

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
export const addProductsToActa = async (req, res, next) => {
  const { acta_id, productos } = req.body;

  // Validación de entrada
  if (!acta_id || !productos || productos.length === 0) {
    return next(new AppError('Faltan datos necesarios: acta_id o productos', 400));
  }

  try {
    // Iniciar transacción
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Iterar sobre los productos y agregar al acta
      for (const item of productos) {
        await transaction.request().input('acta_id', sql.Int, acta_id)
          .input('producto_id', sql.Int, item.producto_id)
          .input('cantidad', sql.Int, item.cantidad)
          .input('precio', sql.Float, item.precio)
          .execute('sp_AgregarProductoActa');
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
export const searchProduct = async (req, res, next) => {
  const { busqueda } = req.query;

  // Validación de entrada
  if (!busqueda) {
    return next(new AppError('El término de búsqueda es obligatorio', 400));
  }

  try {
    // Ejecutar búsqueda
    const result = await executeQuery(
      'EXEC sp_BuscarProducto @busqueda = @searchTerm',
      [{ name: 'searchTerm', type: sql.NVarChar, value: busqueda }]
    );

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
export const loadActaToInventory = async (req, res, next) => {
  const { acta_id } = req.body;

  // Validación de entrada
  if (!acta_id) {
    return next(new AppError('El acta_id es obligatorio', 400));
  }

  try {
    // Verificar si el acta existe
    const acta = await executeQuery(
      'EXEC sp_GetActaById @acta_id = @id',
      [{ name: 'id', type: sql.Int, value: acta_id }]
    );

    if (!acta || !acta.recordset.length) {
      return next(new AppError('Acta no encontrada', 404));
    }

    // Ejecutar procedimiento para cargar productos en el inventario
    const result = await executeQuery(
      'EXEC sp_CargarActaInventario @acta_id = @id',
      [{ name: 'id', type: sql.Int, value: acta_id }]
    );

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

// Funciones adicionales para las rutas
export const obtenerRecepciones = async (req, res, next) => {
  try {
    const result = await executeQuery(
      'EXEC sp_ObtenerTodasLasRecepciones'
    );

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    next(new AppError('Error al obtener las recepciones', 500));
  }
};

export const obtenerRecepcionPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'EXEC sp_ObtenerRecepcionPorId @id = @recepcionId',
      [{ name: 'recepcionId', type: sql.Int, value: id }]
    );

    if (!result.recordset.length) {
      return next(new AppError('Recepcion no encontrada', 404));
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    next(new AppError('Error al obtener la recepción', 500));
  }
};

export const registrarRecepcion = async (req, res, next) => {
  try {
    // Primero crear el acta
    const actaResponse = await createActa(req, res, next);

    // Si hay productos, agregarlos
    if (req.body.productos && req.body.productos.length > 0) {
      req.body.acta_id = actaResponse.data.acta_id;
      await addProductsToActa(req, res, next);
    }

    res.status(201).json({
      success: true,
      message: 'Recepción registrada completamente'
    });
  } catch (error) {
    next(new AppError('Error al registrar la recepción completa', 500));
  }
};