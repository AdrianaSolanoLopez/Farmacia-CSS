//12. Modelo: AjusteInventario
//Para registrar ajustes realizados por diferencias en el stock, ya sea por pérdida, vencimiento, conteos, etc.

// models/AjusteInventario.js

const db = require('../config/db');

const AjusteInventario = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM AjustesInventario');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener los ajustes de inventario: ' + error.message);
    }
  },

  async create(ajuste) {
    const { producto_id, cantidad, tipo_ajuste, fecha } = ajuste;
    try {
      const result = await db.query(`
        INSERT INTO AjustesInventario (producto_id, cantidad, tipo_ajuste, fecha)
        VALUES (@producto_id, @cantidad, @tipo_ajuste, @fecha)
      `, { producto_id, cantidad, tipo_ajuste, fecha });
      return result;
    } catch (error) {
      throw new Error('Error al crear el ajuste de inventario: ' + error.message);
    }
  },

  async delete(id) {
    try {
      const result = await db.query('DELETE FROM AjustesInventario WHERE id = @id', { id });
      return result;
    } catch (error) {
      throw new Error('Error al eliminar el ajuste de inventario: ' + error.message);
    }
  }
};

module.exports = AjusteInventario;

