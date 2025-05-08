import { executeQuery, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';
import moment from 'moment';

/**
 * Registra una nueva venta con manejo de inventario FEFO
 * @param {number} cliente_id - ID del cliente
 * @param {number} usuario_id - ID del usuario/vendedor
 * @param {Array} productos - Lista de productos vendidos
 * @param {string} metodo_pago - Método de pago (efectivo, tarjeta, etc.)
 * @returns {Object} - Detalles de la venta registrada
 */
export const registrarVenta = async (req, res, next) => {
  const { cliente_id, usuario_id, productos, metodo_pago } = req.body;

  // Validaciones básicas
  if (!cliente_id || !usuario_id || !productos?.length || !metodo_pago) {
    return next(new AppError('Datos incompletos para registrar la venta', 400));
  }

  // Validar estructura de productos
  if (!productos.every(p => p.producto_id && p.cantidad > 0 && p.precio_venta > 0)) {
    return next(new AppError('Estructura de productos inválida', 400));
  }

  const transaction = new sql.Transaction(await getPool());

  try {
    await transaction.begin();

    // Calcular total de la venta
    const total = productos.reduce((sum, p) => sum + (p.precio_venta * p.cantidad), 0);
    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');

    // 1. Registrar cabecera de venta
    const ventaResult = await transaction.request()
      .input('cliente_id', sql.Int, cliente_id)
      .input('usuario_id', sql.Int, usuario_id)
      .input('fecha', sql.DateTime, fecha)
      .input('total', sql.Decimal(10, 2), total)
      .input('metodo_pago', sql.NVarChar(50), metodo_pago)
      .query(`
        INSERT INTO Ventas (cliente_id, usuario_id, fecha, total, metodo_pago)
        OUTPUT INSERTED.id
        VALUES (@cliente_id, @usuario_id, @fecha, @total, @metodo_pago)
      `);

    const venta_id = ventaResult.recordset[0].id;

    // 2. Procesar cada producto
    for (const producto of productos) {
      const { producto_id, cantidad, precio_venta } = producto;
      let cantidadRestante = cantidad;

      // Obtener lotes disponibles ordenados por fecha de vencimiento (FEFO)
      const lotesResult = await transaction.request()
        .input('producto_id', sql.Int, producto_id)
        .query(`
          SELECT id, cantidad_disponible
          FROM Lotes
          WHERE producto_id = @producto_id AND cantidad_disponible > 0
          ORDER BY fecha_vencimiento ASC
        `);

      if (!lotesResult.recordset.length) {
        throw new AppError(`No hay stock disponible para el producto ID: ${producto_id}`, 400);
      }

      // Descontar de lotes y registrar detalles
      for (const lote of lotesResult.recordset) {
        if (cantidadRestante <= 0) break;

        const cantidadDescontar = Math.min(lote.cantidad_disponible, cantidadRestante);

        await transaction.request()
          .input('cantidad', sql.Int, cantidadDescontar)
          .input('lote_id', sql.Int, lote.id)
          .query(`
            UPDATE Lotes
            SET cantidad_disponible = cantidad_disponible - @cantidad
            WHERE id = @lote_id
          `);

        await transaction.request()
          .input('venta_id', sql.Int, venta_id)
          .input('producto_id', sql.Int, producto_id)
          .input('lote_id', sql.Int, lote.id)
          .input('cantidad', sql.Int, cantidadDescontar)
          .input('precio_unitario', sql.Decimal(10, 2), precio_venta)
          .query(`
            INSERT INTO DetalleVenta 
            (venta_id, producto_id, lote_id, cantidad, precio_unitario)
            VALUES (@venta_id, @producto_id, @lote_id, @cantidad, @precio_unitario)
          `);

        cantidadRestante -= cantidadDescontar;
      }

      if (cantidadRestante > 0) {
        throw new AppError(`Stock insuficiente para el producto ID: ${producto_id}`, 400);
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: {
        venta_id,
        fecha,
        total,
        productos_vendidos: productos.length
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en registrarVenta:', error);
    next(error instanceof AppError ? error : new AppError('Error al registrar la venta', 500));
  }
};

/**
 * Obtiene el historial completo de ventas
 * @returns {Array} - Lista de ventas con información básica
 */
export const getHistorialVentas = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await executeQuery(
      `SELECT 
        v.id, 
        FORMAT(v.fecha, 'yyyy-MM-dd HH:mm') AS fecha,
        v.total, 
        v.metodo_pago, 
        c.nombre AS cliente, 
        u.nombre AS usuario
      FROM Ventas v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      JOIN Usuarios u ON v.usuario_id = u.id
      ORDER BY v.fecha DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      [
        { name: 'offset', type: sql.Int, value: offset },
        { name: 'limit', type: sql.Int, value: limit }
      ]
    );

    const totalResult = await executeQuery('SELECT COUNT(*) AS total FROM Ventas');

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
    console.error('Error en getHistorialVentas:', error);
    next(new AppError('Error al obtener el historial de ventas', 500));
  }
};

/**
 * Obtiene el detalle completo de una venta específica
 * @param {number} venta_id - ID de la venta a consultar
 * @returns {Object} - Detalles completos de la venta
 */
export const getDetalleVenta = async (req, res, next) => {
  const { venta_id } = req.params;

  if (!venta_id || isNaN(venta_id)) {
    return next(new AppError('ID de venta inválido', 400));
  }

  try {
    const [venta, detalles] = await Promise.all([
      executeQuery(
        `SELECT 
          v.id,
          FORMAT(v.fecha, 'yyyy-MM-dd HH:mm') AS fecha,
          v.total,
          v.metodo_pago,
          c.nombre AS cliente,
          c.documento,
          u.nombre AS vendedor
        FROM Ventas v
        LEFT JOIN Clientes c ON v.cliente_id = c.id
        JOIN Usuarios u ON v.usuario_id = u.id
        WHERE v.id = @venta_id`,
        [{ name: 'venta_id', type: sql.Int, value: venta_id }]
      ),
      executeQuery(
        `SELECT 
          dv.id,
          p.nombre AS producto,
          p.codigo,
          l.numero_lote,
          FORMAT(l.fecha_vencimiento, 'yyyy-MM-dd') AS fecha_vencimiento,
          dv.cantidad,
          dv.precio_unitario,
          (dv.cantidad * dv.precio_unitario) AS subtotal
        FROM DetalleVenta dv
        JOIN Productos p ON dv.producto_id = p.id
        JOIN Lotes l ON dv.lote_id = l.id
        WHERE dv.venta_id = @venta_id
        ORDER BY p.nombre`,
        [{ name: 'venta_id', type: sql.Int, value: venta_id }]
      )
    ]);

    if (!venta.recordset.length) {
      return next(new AppError('Venta no encontrada', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        ...venta.recordset[0],
        detalles: detalles.recordset,
        total_productos: detalles.recordset.length
      }
    });

  } catch (error) {
    console.error('Error en getDetalleVenta:', error);
    next(new AppError('Error al obtener el detalle de la venta', 500));
  }
};

/**
 * Obtiene ventas dentro de un rango de fechas
 * @param {Date} desde - Fecha de inicio (YYYY-MM-DD)
 * @param {Date} hasta - Fecha de fin (YYYY-MM-DD)
 * @returns {Array} - Lista de ventas en el rango especificado
 */
export const getVentasPorFecha = async (req, res, next) => {
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return next(new AppError('Las fechas desde y hasta son requeridas', 400));
  }

  try {
    const result = await executeQuery(
      `SELECT 
        v.id,
        FORMAT(v.fecha, 'yyyy-MM-dd HH:mm') AS fecha,
        v.total,
        v.metodo_pago,
        c.nombre AS cliente,
        u.nombre AS vendedor
      FROM Ventas v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      JOIN Usuarios u ON v.usuario_id = u.id
      WHERE v.fecha BETWEEN @desde AND @hasta
      ORDER BY v.fecha DESC`,
      [
        { name: 'desde', type: sql.Date, value: desde },
        { name: 'hasta', type: sql.Date, value: hasta }
      ]
    );

    const totalResult = await executeQuery(
      `SELECT 
        SUM(total) AS total_ventas,
        COUNT(id) AS cantidad_ventas
      FROM Ventas
      WHERE fecha BETWEEN @desde AND @hasta`,
      [
        { name: 'desde', type: sql.Date, value: desde },
        { name: 'hasta', type: sql.Date, value: hasta }
      ]
    );

    res.status(200).json({
      success: true,
      data: result.recordset,
      meta: {
        total_ventas: totalResult.recordset[0].total_ventas || 0,
        cantidad_ventas: totalResult.recordset[0].cantidad_ventas || 0,
        desde,
        hasta
      }
    });

  } catch (error) {
    console.error('Error en getVentasPorFecha:', error);
    next(new AppError('Error al obtener ventas por fecha', 500));
  }
};

/**
 * Elimina una venta y revierte el stock
 * @param {number} id - ID de la venta a eliminar
 * @returns {Object} - Confirmación de la eliminación
 */
export const eliminarVenta = async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new AppError('ID de venta inválido', 400));
  }

  const transaction = new sql.Transaction(await getPool());

  try {
    await transaction.begin();

    // 1. Obtener detalles para revertir stock
    const detalles = await transaction.request()
      .input('id', sql.Int, id)
      .query('SELECT lote_id, cantidad FROM DetalleVenta WHERE venta_id = @id');

    // 2. Revertir stock en lotes
    for (const item of detalles.recordset) {
      await transaction.request()
        .input('cantidad', sql.Int, item.cantidad)
        .input('lote_id', sql.Int, item.lote_id)
        .query(`
          UPDATE Lotes
          SET cantidad_disponible = cantidad_disponible + @cantidad
          WHERE id = @lote_id
        `);
    }

    // 3. Eliminar registros
    await transaction.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM DetalleVenta WHERE venta_id = @id');

    const deleteResult = await transaction.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Ventas WHERE id = @id');

    if (deleteResult.rowsAffected[0] === 0) {
      throw new AppError('Venta no encontrada', 404);
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Venta eliminada y stock revertido correctamente',
      data: {
        venta_id: id,
        lotes_afectados: detalles.recordset.length
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en eliminarVenta:', error);
    next(error instanceof AppError ? error : new AppError('Error al eliminar la venta', 500));
  }
};