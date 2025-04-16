//4. Controlador: Configuración del Sistema (configuracionController.js)

const db = require('../config/db');

const configuracionController = {
  obtenerConfiguracion: async (req, res) => {
    try {
      const config = await db.query(`SELECT * FROM ConfiguracionSistema`);
      res.json(config.recordset[0]);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  actualizarConfiguracion: async (req, res) => {
    const { alertaDiasVencimiento, porcentajeIVA } = req.body;

    try {
      await db.query(
        `UPDATE ConfiguracionSistema 
         SET alerta_dias_vencimiento = @alertaDiasVencimiento, 
             porcentaje_iva = @porcentajeIVA`,
        { alertaDiasVencimiento, porcentajeIVA }
      );

      res.json({ mensaje: 'Configuración actualizada con éxito' });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  }
};

module.exports = configuracionController;
