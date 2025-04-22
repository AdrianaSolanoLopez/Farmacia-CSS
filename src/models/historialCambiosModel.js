//15. Modelo: HistorialCambio
//Permite auditar cualquier cambio importante en los productos, lotes, precios, ajustes de inventario, etc.

// models/HistorialCambio.js

const db = require('../config/db');

const HistorialCambio = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM HistorialCambios');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener el historial de cambios: ' + error.message);
    }
  },

  async create(cambio) {
    const { usuario_id, descripcion, fecha } = cambio;
    try {
      const result = await db.query(`
        INSERT INTO HistorialCambios (usuario_id, descripcion, fecha)
        VALUES (@usuario_id, @descripcion, @fecha)
      `, { usuario_id, descripcion, fecha });
      return result;
    } catch (error) {
      throw new Error('Error al crear el historial de cambios: ' + error.message);
    }
  }
};

module.exports = HistorialCambio;
