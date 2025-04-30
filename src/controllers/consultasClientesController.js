//Controlador: consultasClientesController.js

// src/controllers/consultasClientesController.js

const db = require('../config/db.js');

const consultasClientesController = {
  // Buscar cliente por documento de identidad
  obtenerClientePorDocumento: async (req, res) => {
    const { documento } = req.params;

    if (!documento) {
      return res.status(400).json({ mensaje: 'Debe proporcionar un documento de identidad.' });
    }

    try {
      const cliente = await db.query(
        `SELECT * FROM Clientes WHERE documento_identidad = @documento`,
        { documento }
      );

      if (cliente.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
      }

      res.json(cliente.recordset[0]);
    } catch (error) {
      console.error('❌ Error al consultar cliente por documento:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor al buscar cliente.' });
    }
  },

  // Historial de compras por cliente
  historialCompras: async (req, res) => {
    const { clienteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({ mensaje: 'Debe proporcionar un ID de cliente.' });
    }

    try {
      const historial = await db.query(
        `SELECT 
           f.id AS factura_id, 
           f.fecha, 
           p.nombre AS nombre_producto, 
           df.cantidad, 
           df.precio_venta
         FROM Facturas f
         INNER JOIN DetalleFactura df ON f.id = df.factura_id
         INNER JOIN Productos p ON df.producto_id = p.id
         WHERE f.cliente_id = @clienteId
         ORDER BY f.fecha DESC`,
        { clienteId }
      );

      res.json(historial.recordset);
    } catch (error) {
      console.error('❌ Error al consultar historial de compras:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor al consultar compras.' });
    }
  },

  // Historial de devoluciones por cliente
  historialDevoluciones: async (req, res) => {
    const { clienteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({ mensaje: 'Debe proporcionar un ID de cliente.' });
    }

    try {
      const devoluciones = await db.query(
        `SELECT 
           d.id, 
           d.fecha, 
           p.nombre AS nombre_producto, 
           d.cantidad_devuelta, 
           d.motivo
         FROM Devoluciones d
         INNER JOIN Productos p ON d.producto_id = p.id
         WHERE d.cliente_id = @clienteId
         ORDER BY d.fecha DESC`,
        { clienteId }
      );

      res.json(devoluciones.recordset);
    } catch (error) {
      console.error('❌ Error al consultar historial de devoluciones:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor al consultar devoluciones.' });
    }
  }
};

module.exports = consultasClientesController;
