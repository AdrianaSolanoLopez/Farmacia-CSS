//Controlador: consultasClientesController.js

const db = require('../config/db');

const consultasClientesController = {
  obtenerClientePorDocumento: async (req, res) => {
    const { documento } = req.params;

    try {
      const cliente = await db.query(
        `SELECT * FROM Clientes WHERE documento_identidad = @documento`,
        { documento }
      );

      if (cliente.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      res.json(cliente.recordset[0]);
    } catch (error) {
      console.error('Error al consultar cliente por documento:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  historialCompras: async (req, res) => {
    const { clienteId } = req.params;

    try {
      const historial = await db.query(
        `SELECT f.id AS factura_id, f.fecha, p.nombre_producto, df.cantidad, df.precio_venta
         FROM Facturas f
         INNER JOIN DetalleFactura df ON f.id = df.factura_id
         INNER JOIN Productos p ON df.producto_id = p.id
         WHERE f.cliente_id = @clienteId
         ORDER BY f.fecha DESC`,
        { clienteId }
      );

      res.json(historial.recordset);
    } catch (error) {
      console.error('Error al consultar historial de compras:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  historialDevoluciones: async (req, res) => {
    const { clienteId } = req.params;

    try {
      const devoluciones = await db.query(
        `SELECT d.id, d.fecha, p.nombre_producto, d.cantidad_devuelta, d.motivo
         FROM Devoluciones d
         INNER JOIN Productos p ON d.producto_id = p.id
         WHERE d.cliente_id = @clienteId
         ORDER BY d.fecha DESC`,
        { clienteId }
      );

      res.json(devoluciones.recordset);
    } catch (error) {
      console.error('Error al consultar historial de devoluciones:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  }
};

module.exports = consultasClientesController;
