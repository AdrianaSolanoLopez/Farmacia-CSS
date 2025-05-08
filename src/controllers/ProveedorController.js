import { executeQuery, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';

/**
 * Obtiene todos los proveedores registrados
 * @returns {Array} Lista de proveedores con información básica
 */
export const obtenerProveedores = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [
      { name: 'offset', type: sql.Int, value: offset },
      { name: 'limit', type: sql.Int, value: limit }
    ];

    if (search) {
      whereClause = 'WHERE nombre LIKE @search OR contacto LIKE @search';
      params.push({
        name: 'search',
        type: sql.NVarChar,
        value: `%${search}%`
      });
    }

    const result = await executeQuery(
      `SELECT 
        id,
        nombre,
        contacto,
        telefono,
        direccion,
        activo
      FROM Proveedores
      ${whereClause}
      ORDER BY nombre
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      params
    );

    const totalResult = await executeQuery(
      `SELECT COUNT(*) AS total FROM Proveedores ${whereClause}`,
      search ? [{ name: 'search', type: sql.NVarChar, value: `%${search}%` }] : []
    );

    res.status(200).json({
      success: true,
      data: result.recordset,
      meta: {
        total: totalResult.recordset[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalResult.recordset[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error en obtenerProveedores:', error);
    next(new AppError('Error al obtener los proveedores', 500));
  }
};

/**
 * Obtiene un proveedor específico por su ID
 * @param {number} id - ID del proveedor a consultar
 * @returns {Object} Información detallada del proveedor
 */
export const obtenerProveedor = async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new AppError('ID de proveedor inválido', 400));
  }

  try {
    const result = await executeQuery(
      `SELECT 
        id,
        nombre,
        contacto,
        telefono,
        direccion,
        email,
        ruc,
        activo,
        fecha_creacion
      FROM Proveedores
      WHERE id = @id`,
      [{ name: 'id', type: sql.Int, value: id }]
    );

    if (!result.recordset.length) {
      return next(new AppError('Proveedor no encontrado', 404));
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error en obtenerProveedor:', error);
    next(new AppError('Error al obtener el proveedor', 500));
  }
};

/**
 * Crea un nuevo proveedor en el sistema
 * @param {string} nombre - Nombre del proveedor
 * @param {string} contacto - Persona de contacto
 * @param {string} telefono - Teléfono de contacto
 * @param {string} direccion - Dirección física
 * @returns {Object} Confirmación y datos del proveedor creado
 */
export const crearProveedor = async (req, res, next) => {
  const { nombre, contacto, telefono, direccion, email, ruc } = req.body;

  if (!nombre || !contacto || !telefono) {
    return next(new AppError('Nombre, contacto y teléfono son obligatorios', 400));
  }

  try {
    const result = await executeQuery(
      `INSERT INTO Proveedores 
        (nombre, contacto, telefono, direccion, email, ruc, activo)
       OUTPUT INSERTED.id, INSERTED.fecha_creacion
       VALUES (@nombre, @contacto, @telefono, @direccion, @email, @ruc, 1)`,
      [
        { name: 'nombre', type: sql.NVarChar(100), value: nombre },
        { name: 'contacto', type: sql.NVarChar(100), value: contacto },
        { name: 'telefono', type: sql.NVarChar(20), value: telefono },
        { name: 'direccion', type: sql.NVarChar(200), value: direccion || null },
        { name: 'email', type: sql.NVarChar(100), value: email || null },
        { name: 'ruc', type: sql.NVarChar(20), value: ruc || null }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: {
        id: result.recordset[0].id,
        fecha_creacion: result.recordset[0].fecha_creacion
      }
    });

  } catch (error) {
    console.error('Error en crearProveedor:', error);

    if (error.number === 2627) { // Violación de unique key
      next(new AppError('Ya existe un proveedor con ese nombre o RUC', 400));
    } else {
      next(new AppError('Error al crear el proveedor', 500));
    }
  }
};

/**
 * Actualiza la información de un proveedor existente
 * @param {number} id - ID del proveedor a actualizar
 * @param {Object} campos - Campos a actualizar
 * @returns {Object} Confirmación de la actualización
 */
export const actualizarProveedor = async (req, res, next) => {
  const { id } = req.params;
  const { nombre, contacto, telefono, direccion, email, ruc, activo } = req.body;

  if (!id || isNaN(id)) {
    return next(new AppError('ID de proveedor inválido', 400));
  }

  try {
    const result = await executeQuery(
      `UPDATE Proveedores SET
        nombre = ISNULL(@nombre, nombre),
        contacto = ISNULL(@contacto, contacto),
        telefono = ISNULL(@telefono, telefono),
        direccion = ISNULL(@direccion, direccion),
        email = ISNULL(@email, email),
        ruc = ISNULL(@ruc, ruc),
        activo = ISNULL(@activo, activo)
      WHERE id = @id
      SELECT * FROM Proveedores WHERE id = @id`,
      [
        { name: 'id', type: sql.Int, value: id },
        { name: 'nombre', type: sql.NVarChar(100), value: nombre || null },
        { name: 'contacto', type: sql.NVarChar(100), value: contacto || null },
        { name: 'telefono', type: sql.NVarChar(20), value: telefono || null },
        { name: 'direccion', type: sql.NVarChar(200), value: direccion || null },
        { name: 'email', type: sql.NVarChar(100), value: email || null },
        { name: 'ruc', type: sql.NVarChar(20), value: ruc || null },
        { name: 'activo', type: sql.Bit, value: activo !== undefined ? activo : null }
      ]
    );

    if (result.rowsAffected[0] === 0) {
      return next(new AppError('Proveedor no encontrado', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error en actualizarProveedor:', error);
    next(new AppError('Error al actualizar el proveedor', 500));
  }
};

/**
 * Desactiva (elimina lógicamente) un proveedor
 * @param {number} id - ID del proveedor a desactivar
 * @returns {Object} Confirmación de la desactivación
 */
export const eliminarProveedor = async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new AppError('ID de proveedor inválido', 400));
  }

  try {
    // Verificar si el proveedor tiene compras asociadas
    const comprasResult = await executeQuery(
      'SELECT COUNT(*) AS total FROM Compras WHERE proveedor_id = @id',
      [{ name: 'id', type: sql.Int, value: id }]
    );

    if (comprasResult.recordset[0].total > 0) {
      return next(new AppError('No se puede eliminar, el proveedor tiene compras asociadas', 400));
    }

    // Eliminación lógica (marcar como inactivo)
    const result = await executeQuery(
      'UPDATE Proveedores SET activo = 0 WHERE id = @id',
      [{ name: 'id', type: sql.Int, value: id }]
    );

    if (result.rowsAffected[0] === 0) {
      return next(new AppError('Proveedor no encontrado', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Proveedor desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarProveedor:', error);
    next(new AppError('Error al desactivar el proveedor', 500));
  }
};