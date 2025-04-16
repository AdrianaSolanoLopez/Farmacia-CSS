//3. Controlador: Historial de Cambios (historialCambiosController.js)

const db = require('../config/db');

const historialCambiosController = {
  obtenerHistorial: async (req, res) => {
    try {
      const historial = await db.query(`
        SELECT h.id, h.fecha, h.usuario, h.modulo_afectado, h.descripcion_cambio
        FROM HistorialCambios h
        ORDER BY h.fecha DESC
      `);

      res.json(historial.recordset);
    } catch (error) {
      console.error('❌ Error al obtener historial de cambios:', error);
      res.status(500).json({ mensaje: 'Error del servidor al obtener historial de cambios.' });
    }
  },

  registrarCambio: async (req, res) => {
    const { usuario, modulo_afectado, descripcion_cambio } = req.body;

    if (!usuario || !modulo_afectado || !descripcion_cambio) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    try {
      const result = await db.query(
        `INSERT INTO HistorialCambios (fecha, usuario, modulo_afectado, descripcion_cambio)
         OUTPUT INSERTED.id
         VALUES (GETDATE(), @usuario, @modulo_afectado, @descripcion_cambio)`,
        { usuario, modulo_afectado, descripcion_cambio }
      );

      res.status(201).json({ 
        mensaje: '✅ Cambio registrado correctamente.', 
        id: result.recordset[0].id 
      });
    } catch (error) {
      console.error('❌ Error al registrar cambio:', error);
      res.status(500).json({ mensaje: 'Error del servidor al registrar cambio.' });
    }
  }
};

module.exports = historialCambiosController;
