import { executeQuery, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';

/**
 * Obtiene todas las ventas entre dos fechas con sus totales
 * @param {Date} fecha_inicio - Fecha de inicio del reporte (YYYY-MM-DD)
 * @param {Date} fecha_fin - Fecha de fin del reporte (YYYY-MM-DD)
 * @returns {Object} - Objeto con ventas, totales y metadatos
 */
export const getVentasPorFecha = async (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.body;

  // Validación de parámetros
  if (!fecha_inicio || !fecha_fin) {
    return next(new AppError('Las fechas de inicio y fin son requeridas', 400));
  }

  // Validar formato de fecha (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fecha_inicio) || !dateRegex.test(fecha_fin)) {
    return next(new AppError('Formato de fecha inválido. Use YYYY-MM-DD', 400));
  }

  try {
    // 1. Obtener cabeceras de ventas
    const ventas = await executeQuery(
      `SELECT 
        V.id AS venta_id, 
        FORMAT(V.fecha_venta, 'yyyy-MM-dd HH:mm') AS fecha_venta,
        V.total_venta, 
        V.tipo_pago, 
        C.nombre AS cliente, 
        U.nombre AS usuario
      FROM Ventas V
      LEFT JOIN Clientes C ON V.cliente_id = C.id
      JOIN Usuarios U ON V.usuario_id = U.id
      WHERE V.fecha_venta BETWEEN @fecha_inicio AND @fecha_fin
      ORDER BY V.fecha_venta DESC`,
      [
        { name: 'fecha_inicio', type: sql.Date, value: fecha_inicio },
        { name: 'fecha_fin', type: sql.Date, value: fecha_fin }
      ]
    );

    if (!ventas.recordset?.length) {
      return next(new AppError('No se encontraron ventas en el rango especificado', 404));
    }

    // 2. Obtener totales por día
    const totalesPorDia = await executeQuery(
      `SELECT 
        FORMAT(V.fecha_venta, 'yyyy-MM-dd') AS fecha,
        COUNT(V.id) AS cantidad_ventas,
        SUM(V.total_venta) AS total_dia,
        SUM(CASE WHEN V.tipo_pago = 'efectivo' THEN V.total_venta ELSE 0 END) AS total_efectivo,
        SUM(CASE WHEN V.tipo_pago = 'tarjeta' THEN V.total_venta ELSE 0 END) AS total_tarjeta
      FROM Ventas V
      WHERE V.fecha_venta BETWEEN @fecha_inicio AND @fecha_fin
      GROUP BY FORMAT(V.fecha_venta, 'yyyy-MM-dd')
      ORDER BY fecha`,
      [
        { name: 'fecha_inicio', type: sql.Date, value: fecha_inicio },
        { name: 'fecha_fin', type: sql.Date, value: fecha_fin }
      ]
    );

    // 3. Calcular total general
    const totalGeneral = ventas.recordset.reduce((sum, venta) => sum + venta.total_venta, 0);

    res.status(200).json({
      success: true,
      data: {
        ventas: ventas.recordset,
        totales_por_dia: totalesPorDia.recordset,
        resumen: {
          total_ventas: ventas.recordset.length,
          total_general: totalGeneral.toFixed(2),
          dias: totalesPorDia.recordset.length
        }
      },
      meta: {
        fecha_inicio,
        fecha_fin,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en getVentasPorFecha:', error);
    next(new AppError('Error al generar el reporte de ventas', 500));
  }
};

/**
 * Obtiene el detalle completo de una venta específica
 * @param {number} venta_id - ID de la venta a consultar
 * @returns {Array} - Lista de productos vendidos con sus detalles
 */
export const getDetalleVenta = async (req, res, next) => {
  const { venta_id } = req.params;

  // Validar que venta_id sea un número
  if (!venta_id || isNaN(parseInt(venta_id))) {
    return next(new AppError('ID de venta inválido', 400));
  }

  try {
    // 1. Obtener cabecera de la venta
    const cabecera = await executeQuery(
      `SELECT 
        V.id, 
        FORMAT(V.fecha_venta, 'yyyy-MM-dd HH:mm') AS fecha_venta,
        V.total_venta,
        V.tipo_pago,
        C.nombre AS cliente,
        U.nombre AS vendedor
      FROM Ventas V
      LEFT JOIN Clientes C ON V.cliente_id = C.id
      JOIN Usuarios U ON V.usuario_id = U.id
      WHERE V.id = @venta_id`,
      [{ name: 'venta_id', type: sql.Int, value: venta_id }]
    );

    if (!cabecera.recordset?.length) {
      return next(new AppError('Venta no encontrada', 404));
    }

    // 2. Obtener detalle de productos
    const detalles = await executeQuery(
      `SELECT 
        DV.producto_id, 
        P.nombre AS producto,
        P.codigo,
        DV.cantidad,
        DV.precio_unitario,
        DV.subtotal
      FROM DetallesVenta DV
      JOIN Productos P ON DV.producto_id = P.id
      WHERE DV.venta_id = @venta_id
      ORDER BY P.nombre`,
      [{ name: 'venta_id', type: sql.Int, value: venta_id }]
    );

    res.status(200).json({
      success: true,
      data: {
        cabecera: cabecera.recordset[0],
        detalles: detalles.recordset,
        total_productos: detalles.recordset.length
      }
    });

  } catch (error) {
    console.error('Error en getDetalleVenta:', error);
    next(new AppError('Error al obtener el detalle de la venta', 500));
  }
};

// Función adicional: Top 10 productos más vendidos en un rango de fechas
export const getTopProductos = async (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.body;

  // Validaciones similares a getVentasPorFecha...

  try {
    const result = await executeQuery(
      `SELECT TOP 10
        P.id,
        P.nombre,
        P.codigo,
        SUM(DV.cantidad) AS total_vendido,
        SUM(DV.subtotal) AS total_ingresos
      FROM DetallesVenta DV
      JOIN Productos P ON DV.producto_id = P.id
      JOIN Ventas V ON DV.venta_id = V.id
      WHERE V.fecha_venta BETWEEN @fecha_inicio AND @fecha_fin
      GROUP BY P.id, P.nombre, P.codigo
      ORDER BY total_vendido DESC`,
      [
        { name: 'fecha_inicio', type: sql.Date, value: fecha_inicio },
        { name: 'fecha_fin', type: sql.Date, value: fecha_fin }
      ]
    );

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    next(new AppError('Error al obtener top productos', 500));
  }
};