import { executeQuery, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';

// Obtener ventas por fecha
export const ventasPorFecha = async (req, res, next) => {
  const { fechaInicio, fechaFin } = req.query;

  // Validación de fechas
  if (!fechaInicio || !fechaFin) {
    return next(new AppError('Las fechas de inicio y fin son requeridas', 400));
  }

  // Validar formato de fechas
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) {
    return next(new AppError('Formato de fecha inválido. Use YYYY-MM-DD', 400));
  }

  try {
    // Realizar la consulta con parámetros
    const result = await executeQuery(
      `SELECT 
        f.id, 
        FORMAT(f.fecha, 'yyyy-MM-dd') AS fecha,
        c.nombre AS cliente, 
        p.nombre AS producto, 
        df.cantidad, 
        df.precio_venta,
        (df.cantidad * df.precio_venta) AS total
      FROM Facturas f
      INNER JOIN Clientes c ON f.cliente_id = c.id
      INNER JOIN DetalleFactura df ON f.id = df.factura_id
      INNER JOIN Productos p ON df.producto_id = p.id
      WHERE f.fecha BETWEEN @fechaInicio AND @fechaFin
      ORDER BY f.fecha DESC`,
      [
        { name: 'fechaInicio', type: sql.Date, value: fechaInicio },
        { name: 'fechaFin', type: sql.Date, value: fechaFin }
      ]
    );

    // Verificar si se encontraron ventas
    if (!result.recordset || result.recordset.length === 0) {
      return next(new AppError('No se encontraron ventas en el rango de fechas especificado', 404));
    }

    // Calcular total general
    const totalGeneral = result.recordset.reduce((sum, venta) => sum + venta.total, 0);

    // Responder con las ventas
    res.status(200).json({
      success: true,
      message: 'Ventas obtenidas exitosamente',
      data: {
        ventas: result.recordset,
        totalVentas: result.recordset.length,
        totalGeneral: parseFloat(totalGeneral.toFixed(2))
      },
      meta: {
        fechaInicio,
        fechaFin
      }
    });

  } catch (error) {
    console.error('Error en ventasPorFecha:', error);
    next(error instanceof AppError ? error : new AppError('Error al obtener reporte de ventas', 500));
  }
};

// Puedes agregar más funciones de reportes aquí
export const resumenVentasPorFecha = async (req, res, next) => {
  const { fechaInicio, fechaFin } = req.query;

  // Validaciones similares a ventasPorFecha...

  try {
    const result = await executeQuery(
      `SELECT 
        FORMAT(f.fecha, 'yyyy-MM-dd') AS fecha,
        COUNT(f.id) AS total_facturas,
        SUM(df.cantidad * df.precio_venta) AS total_ventas
      FROM Facturas f
      INNER JOIN DetalleFactura df ON f.id = df.factura_id
      WHERE f.fecha BETWEEN @fechaInicio AND @fechaFin
      GROUP BY f.fecha
      ORDER BY f.fecha`,
      [
        { name: 'fechaInicio', type: sql.Date, value: fechaInicio },
        { name: 'fechaFin', type: sql.Date, value: fechaFin }
      ]
    );

    res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    next(new AppError('Error al obtener resumen de ventas', 500));
  }
};