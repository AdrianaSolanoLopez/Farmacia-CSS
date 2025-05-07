// src/controllers/configuracionController.js

import sql from 'mssql';
import { pool } from '../config/db.js'; // ✅ Corrección aquí

const configuracionController = {
  // Obtener la configuración actual del sistema
  obtenerConfiguracion: async (req, res) => {
    try {
      const resultado = await pool.request().query('SELECT * FROM ConfiguracionSistema');

      if (resultado.recordset.length === 0) {
        return res.status(404).json({ mensaje: 'No se encontró configuración registrada.' });
      }

      res.status(200).json(resultado.recordset[0]);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({
        mensaje: 'Error al obtener configuración.',
        error: error.message
      });
    }
  },

  // Actualizar la configuración del sistema
  actualizarConfiguracion: async (req, res) => {
    const { alertaDiasVencimiento, porcentajeIVA } = req.body;

    // Validaciones básicas
    if (
      typeof alertaDiasVencimiento !== 'number' || alertaDiasVencimiento < 0 ||
      typeof porcentajeIVA !== 'number' || porcentajeIVA < 0
    ) {
      return res.status(400).json({
        mensaje: 'Los valores de alertaDiasVencimiento y porcentajeIVA deben ser números válidos y mayores o iguales a cero.'
      });
    }

    try {
      await pool.request()
        .input('alertaDiasVencimiento', sql.Int, alertaDiasVencimiento)
        .input('porcentajeIVA', sql.Decimal(5, 2), porcentajeIVA)
        .query(`
          UPDATE ConfiguracionSistema 
          SET alerta_dias_vencimiento = @alertaDiasVencimiento, 
              porcentaje_iva = @porcentajeIVA
        `);

      const configActualizada = await pool.request().query('SELECT * FROM ConfiguracionSistema');

      res.status(200).json({
        mensaje: 'Configuración actualizada con éxito.',
        configuracion: configActualizada.recordset[0]
      });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      res.status(500).json({
        mensaje: 'Error al actualizar configuración.',
        error: error.message
      });
    }
  }
};

export default configuracionController;
