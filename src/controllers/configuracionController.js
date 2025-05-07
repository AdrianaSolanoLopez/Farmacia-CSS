// src/controllers/configuracionController.js
import { pool } from '../config/db.js';  // Ajusta si tu ruta es diferente

const configuracionController = {
  // Obtener configuración del sistema
  obtenerConfiguracion: async (req, res) => {
    try {
      // Obtenemos todas las configuraciones de la tabla
      const result = await pool.request().query('SELECT * FROM ConfiguracionSistema');

      // Verificamos si hay datos
      if (result.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'No se encontró configuración registrada.' });
      }

      // Devolvemos la configuración
      res.json(result.recordset);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ mensaje: 'Error al obtener configuración.', error: error.message });
    }
  },

  // Actualizar la configuración del sistema
  actualizarConfiguracion: async (req, res) => {
    const { clave, valor } = req.body;

    // Validamos que se haya enviado una clave y un valor
    if (!clave || !valor) {
      return res.status(400).json({ mensaje: 'Se requiere clave y valor para actualizar la configuración.' });
    }

    try {
      // Actualizamos el valor de la clave en la tabla
      const result = await pool.request()
        .input('clave', clave)
        .input('valor', valor)
        .query(`
          UPDATE ConfiguracionSistema 
          SET valor = @valor 
          WHERE clave = @clave
        `);

      // Verificamos si la clave fue actualizada
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ mensaje: 'No se encontró la configuración para la clave proporcionada.' });
      }

      // Obtenemos la configuración actualizada
      const configActualizada = await pool.request().query('SELECT * FROM ConfiguracionSistema');
      res.json({
        mensaje: 'Configuración actualizada con éxito.',
        configuracion: configActualizada.recordset
      });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      res.status(500).json({ mensaje: 'Error al actualizar configuración.', error: error.message });
    }
  }
};

export default configuracionController;
