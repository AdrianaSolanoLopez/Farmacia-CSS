//Controlador: consultasClientesController.js

// src/controllers/consultasClientesController.js

import sql from 'mssql';
import pool from '../config/db.js';

const consultasClientesController = {
  // Buscar cliente por documento de identidad
  obtenerClientePorDocumento: async (req, res) => {
    const { documento } = req.params;

    if (!documento) {
      return res.status(400).json({ mensaje: 'Debe proporcionar un documento de identidad.' });
    }

    try {
      const cliente = await pool.request()
        .input('documento', sql.VarChar, documento)
        .query(`SELECT * FROM Clientes WHERE documento_identidad = @documento`);

      if (cliente.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
      }

      res.json(cliente.recordset[0]);
    } catch (error) {
      console.error('Error al consultar cliente por documento:', error);
      res.status(500).json({ mensaje: 'Error interno al buscar cliente.', error: error.message });
    }
  },

  // Historial de compras por cliente
  historialCompras: async (req, res) => {
    const { clienteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({ mensaje: 'Debe proporcionar un ID de cliente.' });
    }

    try {
      const historial = await pool.request()
        .input('clienteId', sql.Int, clienteId)
        .query(`
          SELECT 
            f.id AS factura_id, 
            f.fecha, 
            p.nombre AS nombre_producto, 
            df.cantidad, 
            df.precio_venta
          FROM Facturas f
          INNER JOIN DetalleFactura df ON f.id = df.factura_id
          INNER JOIN Productos p ON df.producto_id = p.id
          WHERE f.cliente_id = @clienteId
          ORDER BY f.fecha DESC
        `);

      res.json(historial.recordset);
    } catch (error) {
      console.error('Error al consultar historial de compras:', error);
      res.status(500).json({ mensaje: 'Error interno al consultar compras.', error: error.message });
    }
  },

  // Historial de devoluciones por cliente
  historialDevoluciones: async (req, res) => {
    const { clienteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({ mensaje: 'Debe proporcionar un ID de cliente.' });
    }

    try {
      const devoluciones = await pool.request()
        .input('clienteId', sql.Int, clienteId)
        .query(`
          SELECT 
            d.id, 
            d.fecha, 
            p.nombre AS nombre_producto, 
            d.cantidad_devuelta, 
            d.motivo
          FROM Devoluciones d
          INNER JOIN Productos p ON d.producto_id = p.id
          WHERE d.cliente_id = @clienteId
          ORDER BY d.fecha DESC
        `);

      res.json(devoluciones.recordset);
    } catch (error) {
      console.error('Error al consultar historial de devoluciones:', error);
      res.status(500).json({ mensaje: 'Error interno al consultar devoluciones.', error: error.message });
    }
  }
};

export default consultasClientesController;
