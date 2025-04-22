//13. Modelo: ConfiguracionSistema
//Permite guardar configuraciones como alertas, márgenes de ganancia, nombre del negocio, etc.

// models/ConfiguracionSistema.js

const db = require('../config/db');

const Configuracion = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM Configuracion');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener la configuración: ' + error.message);
    }
  },

  async update(id, configuracion) {
    const { clave, valor } = configuracion;
    try {
      const result = await db.query(`
        UPDATE Configuracion
        SET clave = @clave, valor = @valor
        WHERE id = @id
      `, { id, clave, valor });
      return result;
    } catch (error) {
      throw new Error('Error al actualizar la configuración: ' + error.message);
    }
  }
};

module.exports = Configuracion;
