import { executeQuery, sql } from '../config/db.js';
import moment from 'moment';

export const getStockActual = async (req, res) => {
  try {
    const { minStock } = req.query;

    const whereClause = minStock
      ? 'HAVING SUM(l.cantidad_disponible) <= @minStock'
      : '';

    const result = await executeQuery(`
      SELECT 
        p.id AS producto_id, 
        p.nombre, 
        p.unidad_medida,
        p.stock_minimo,
        SUM(l.cantidad_disponible) AS stock_total,
        CASE 
          WHEN SUM(l.cantidad_disponible) <= p.stock_minimo THEN 'CRÍTICO'
          WHEN SUM(l.cantidad_disponible) <= p.stock_minimo * 1.5 THEN 'ALERTA'
          ELSE 'NORMAL'
        END AS estado_stock
      FROM Productos p
      LEFT JOIN Lotes l ON p.id = l.producto_id
      WHERE p.estado = 1
      GROUP BY p.id, p.nombre, p.unidad_medida, p.stock_minimo
      ${whereClause}
      ORDER BY estado_stock, p.nombre
    `, minStock ? [{ name: 'minStock', value: parseInt(minStock), type: sql.Int }] : []);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        filtered: minStock ? `Stock <= ${minStock}` : 'Todos'
      }
    });
  } catch (error) {
    console.error('Error en getStockActual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock actual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getStockByProductoId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await executeQuery(`
      SELECT 
        l.id AS lote_id, 
        l.numero_lote, 
        FORMAT(l.fecha_vencimiento, 'yyyy-MM-dd') AS fecha_vencimiento,
        l.cantidad_disponible,
        DATEDIFF(DAY, GETDATE(), l.fecha_vencimiento) AS dias_restantes,
        CASE 
          WHEN l.fecha_vencimiento <= DATEADD(DAY, 30, GETDATE()) THEN 'PRONTO_A_VENCER'
          ELSE 'VIGENTE'
        END AS estado_lote
      FROM Lotes l
      WHERE l.producto_id = @producto_id
        AND l.cantidad_disponible > 0
      ORDER BY l.fecha_vencimiento ASC
    `, [{ name: 'producto_id', value: parseInt(id), type: sql.Int }]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron lotes para este producto'
      });
    }

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        producto_id: id,
        total_lotes: result.recordset.length,
        stock_total: result.recordset.reduce((sum, lote) => sum + lote.cantidad_disponible, 0)
      }
    });
  } catch (error) {
    console.error('Error en getStockByProductoId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock por producto'
    });
  }
};

export const ajustarInventario = async (req, res) => {
  const { lote_id, tipo_ajuste, cantidad, motivo, usuario } = req.body;

  // Validaciones mejoradas
  if (!lote_id || !tipo_ajuste || !cantidad || !motivo || !usuario) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios',
      requiredFields: ['lote_id', 'tipo_ajuste', 'cantidad', 'motivo', 'usuario']
    });
  }

  if (isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({
      success: false,
      message: 'La cantidad debe ser un número positivo'
    });
  }

  if (!['entrada', 'salida'].includes(tipo_ajuste)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de ajuste inválido (debe ser "entrada" o "salida")'
    });
  }

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();

    // 1. Verificar lote
    const lote = await executeQuery(
      `SELECT cantidad_disponible, producto_id FROM Lotes WHERE id = @lote_id`,
      [{ name: 'lote_id', value: lote_id, type: sql.Int }],
      { transaction }
    );

    if (lote.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Lote no encontrado'
      });
    }

    // 2. Validar stock para salidas
    const stockActual = lote.recordset[0].cantidad_disponible;
    const productoId = lote.recordset[0].producto_id;

    if (tipo_ajuste === 'salida' && stockActual < cantidad) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente para realizar la salida',
        stock_actual: stockActual,
        cantidad_solicitada: cantidad
      });
    }

    // 3. Calcular nuevo stock
    const nuevaCantidad = tipo_ajuste === 'entrada'
      ? stockActual + cantidad
      : stockActual - cantidad;

    // 4. Actualizar lote
    await executeQuery(
      `UPDATE Lotes SET cantidad_disponible = @nuevaCantidad WHERE id = @lote_id`,
      [
        { name: 'nuevaCantidad', value: nuevaCantidad, type: sql.Int },
        { name: 'lote_id', value: lote_id, type: sql.Int }
      ],
      { transaction }
    );

    // 5. Registrar ajuste
    await executeQuery(
      `INSERT INTO AjustesInventario 
       (lote_id, producto_id, tipo_ajuste, cantidad, motivo, usuario, fecha)
       VALUES (@lote_id, @producto_id, @tipo_ajuste, @cantidad, @motivo, @usuario, @fecha)`,
      [
        { name: 'lote_id', value: lote_id, type: sql.Int },
        { name: 'producto_id', value: productoId, type: sql.Int },
        { name: 'tipo_ajuste', value: tipo_ajuste, type: sql.NVarChar(20) },
        { name: 'cantidad', value: cantidad, type: sql.Int },
        { name: 'motivo', value: motivo, type: sql.NVarChar(255) },
        { name: 'usuario', value: usuario, type: sql.NVarChar(100) },
        { name: 'fecha', value: moment().toDate(), type: sql.DateTime }
      ],
      { transaction }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Ajuste de inventario registrado correctamente',
      data: {
        lote_id,
        stock_anterior: stockActual,
        stock_actual: nuevaCantidad,
        diferencia: tipo_ajuste === 'entrada' ? cantidad : -cantidad
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error en ajustarInventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar ajuste de inventario'
    });
  }
};

export const getHistorialAjustes = async (req, res) => {
  try {
    const { producto_id, tipo_ajuste, usuario, desde, hasta } = req.query;

    const whereConditions = [];
    const params = [];

    if (producto_id) {
      whereConditions.push('ai.producto_id = @producto_id');
      params.push({ name: 'producto_id', value: producto_id, type: sql.Int });
    }

    if (tipo_ajuste) {
      whereConditions.push('ai.tipo_ajuste = @tipo_ajuste');
      params.push({ name: 'tipo_ajuste', value: tipo_ajuste, type: sql.NVarChar(20) });
    }

    if (usuario) {
      whereConditions.push('ai.usuario = @usuario');
      params.push({ name: 'usuario', value: usuario, type: sql.NVarChar(100) });
    }

    if (desde && hasta) {
      whereConditions.push('ai.fecha BETWEEN @desde AND @hasta');
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
        ai.id,
        FORMAT(ai.fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha,
        p.nombre AS producto, 
        l.numero_lote, 
        ai.tipo_ajuste,
        ai.cantidad, 
        ai.motivo,
        ai.usuario
      FROM AjustesInventario ai
      JOIN Lotes l ON ai.lote_id = l.id
      JOIN Productos p ON ai.producto_id = p.id
      ${whereClause}
      ORDER BY ai.fecha DESC
    `, params);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        filters: {
          producto_id,
          tipo_ajuste,
          usuario,
          desde,
          hasta
        }
      }
    });
  } catch (error) {
    console.error('Error en getHistorialAjustes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de ajustes'
    });
  }
};