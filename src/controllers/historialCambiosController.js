import { executeQuery, sql } from '../config/db.js';

export const obtenerHistorial = async (req, res) => {
  try {
    const { modulo, usuario, desde, hasta } = req.query;

    const whereConditions = [];
    const params = [];

    if (modulo) {
      whereConditions.push('h.modulo_afectado = @modulo');
      params.push({ name: 'modulo', value: modulo, type: sql.NVarChar(50) });
    }

    if (usuario) {
      whereConditions.push('h.usuario = @usuario');
      params.push({ name: 'usuario', value: usuario, type: sql.NVarChar(100) });
    }

    if (desde && hasta) {
      whereConditions.push('h.fecha BETWEEN @desde AND @hasta');
      params.push(
        { name: 'desde', value: desde, type: sql.DateTime },
        { name: 'hasta', value: hasta, type: sql.DateTime }
      );
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const result = await executeQuery(`
      SELECT 
        h.id, 
        FORMAT(h.fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha,
        h.usuario, 
        h.modulo_afectado, 
        h.descripcion_cambio
      FROM HistorialCambios h
      ${whereClause}
      ORDER BY h.fecha DESC
    `, params);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        filters: {
          modulo,
          usuario,
          desde,
          hasta
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerHistorial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de cambios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const registrarCambio = async (req, res) => {
  const { usuario, modulo_afectado, descripcion_cambio } = req.body;

  // Validaciones mejoradas
  if (!usuario?.trim() || !modulo_afectado?.trim() || !descripcion_cambio?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios',
      requiredFields: ['usuario', 'modulo_afectado', 'descripcion_cambio'],
      received: req.body
    });
  }

  if (descripcion_cambio.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'La descripción no puede exceder los 500 caracteres',
      maxLength: 500,
      currentLength: descripcion_cambio.length
    });
  }

  try {
    const result = await executeQuery(
      `INSERT INTO HistorialCambios 
       (fecha, usuario, modulo_afectado, descripcion_cambio)
       OUTPUT INSERTED.id, INSERTED.fecha
       VALUES (GETDATE(), @usuario, @modulo_afectado, @descripcion_cambio)`,
      [
        { name: 'usuario', value: usuario.trim(), type: sql.NVarChar(100) },
        { name: 'modulo_afectado', value: modulo_afectado.trim(), type: sql.NVarChar(50) },
        { name: 'descripcion_cambio', value: descripcion_cambio.trim(), type: sql.NVarChar(500) }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cambio registrado exitosamente',
      data: {
        id: result.recordset[0].id,
        fecha: result.recordset[0].fecha
      }
    });

  } catch (error) {
    console.error('Error en registrarCambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cambio',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};