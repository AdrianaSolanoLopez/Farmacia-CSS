//2. Controlador: Reportes de Ventas por Fecha (reportesController.js)

const db = require('../config/db');

const reportesController = {
  ventasPorFecha: async (req, res) => {
    const { fechaInicio, fechaFin } = req.query;

    try {
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

      res.json(ventas.recordset);
    } catch (error) {
      console.error('Error al obtener reportes de ventas por fecha:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  }
};

module.exports = reportesController;
