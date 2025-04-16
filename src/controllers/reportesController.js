//2. Controlador: Reportes de Ventas por Fecha (reportesController.js)

const db = require('../config/db');

const reportesController = {
  // Obtener ventas por fecha
  ventasPorFecha: async (req, res, next) => {
    const { fechaInicio, fechaFin } = req.query;

    // Validación de fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Las fechas de inicio y fin son requeridas' });
    }

    // Asegurarse de que las fechas sean válidas
    const isValidDate = (date) => !isNaN(Date.parse(date));
    if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) {
      return res.status(400).json({ mensaje: 'Fechas inválidas' });
    }

    try {
      // Realizar la consulta con parámetros
      const ventas = await db.query(
        `SELECT f.id, f.fecha, c.nombre AS cliente, p.nombre_producto, df.cantidad, df.precio_venta
         FROM Facturas f
         INNER JOIN Clientes c ON f.cliente_id = c.id
         INNER JOIN DetalleFactura df ON f.id = df.factura_id
         INNER JOIN Productos p ON df.producto_id = p.id
         WHERE f.fecha BETWEEN @fechaInicio AND @fechaFin
         ORDER BY f.fecha DESC`,
        { fechaInicio, fechaFin }
      );

      // Verificar si se encontraron ventas
      if (!ventas.recordset || ventas.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'No se encontraron ventas en el rango de fechas especificado' });
      }

      // Responder con las ventas
      res.json({
        success: true,
        message: 'Ventas obtenidas exitosamente',
        data: ventas.recordset
      });
    } catch (error) {
      console.error('Error al obtener reportes de ventas por fecha:', error);
      // Manejar errores más específicos
      if (error.code === 'ECONNREFUSED') {
        return next(new AppError('Error de conexión con la base de datos', 500));
      }
      res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
    }
  }
};

module.exports = reportesController;
