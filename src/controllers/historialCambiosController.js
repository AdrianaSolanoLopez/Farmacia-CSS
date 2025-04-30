const db = require('../config/db.js');

const historialCambiosController = {
  // Obtener historial de cambios
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

  // Registrar un nuevo cambio
  registrarCambio: async (req, res) => {
    const { usuario, modulo_afectado, descripcion_cambio } = req.body;

    // Validaciones de los datos
    if (!usuario || !modulo_afectado || !descripcion_cambio) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    try {
      // Usar parámetros para la consulta, evitando inyecciones SQL
      const query = `
        INSERT INTO HistorialCambios (fecha, usuario, modulo_afectado, descripcion_cambio)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @usuario, @modulo_afectado, @descripcion_cambio)
      `;

      const result = await db.query(query, {
        usuario,
        modulo_afectado,
        descripcion_cambio
      });

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
