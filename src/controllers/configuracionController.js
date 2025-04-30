//4. Controlador: Configuración del Sistema (configuracionController.js)

// src/controllers/configuracionController.js

const db = require('../config/db.js');

const configuracionController = {
  // Obtener la configuración actual del sistema
  obtenerConfiguracion: async (req, res) => {
    try {
      const config = await db.query('SELECT * FROM ConfiguracionSistema');

      if (config.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'No se encontró configuración registrada.' });
      }

      res.json(config.recordset[0]);
    } catch (error) {
      console.error('❌ Error al obtener configuración:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor al obtener configuración.' });
    }
  },

  // Actualizar la configuración del sistema
  actualizarConfiguracion: async (req, res) => {
    const { alertaDiasVencimiento, porcentajeIVA } = req.body;

    // Validaciones básicas
    if (
      alertaDiasVencimiento === undefined || isNaN(alertaDiasVencimiento) || alertaDiasVencimiento < 0 ||
      porcentajeIVA === undefined || isNaN(porcentajeIVA) || porcentajeIVA < 0
    ) {
      return res.status(400).json({
        mensaje: 'Los valores de alertaDiasVencimiento y porcentajeIVA deben ser números positivos.'
      });
    }

    try {
      // Actualizar configuración en la base de datos
      await db.query(
        `UPDATE ConfiguracionSistema 
         SET alerta_dias_vencimiento = @alertaDiasVencimiento, 
             porcentaje_iva = @porcentajeIVA`,
        { alertaDiasVencimiento, porcentajeIVA }
      );

      // Consultamos de nuevo para confirmar y devolver la configuración actualizada
      const configActualizada = await db.query('SELECT * FROM ConfiguracionSistema');
      res.json({
        mensaje: 'Configuración actualizada con éxito.',
        configuracion: configActualizada.recordset[0]
      });
    } catch (error) {
      console.error('❌ Error al actualizar configuración:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor al actualizar configuración.' });
    }
  }
};

module.exports = configuracionController;
