const db = require('../config/db');

const Alerta = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM Alertas');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener las alertas: ' + error.message);
    }
  },

  async create(alerta) {
    const { tipo, mensaje, fecha } = alerta;
    try {
      const result = await db.query(`
        INSERT INTO Alertas (tipo, mensaje, fecha)
        VALUES (@tipo, @mensaje, @fecha)
      `, { tipo, mensaje, fecha });
      return result;
    } catch (error) {
      throw new Error('Error al crear la alerta: ' + error.message);
    }
  },

  async delete(id) {
    try {
      const result = await db.query('DELETE FROM Alertas WHERE id = @id', { id });
      return result;
    } catch (error) {
      throw new Error('Error al eliminar la alerta: ' + error.message);
    }
  }
};

module.exports = Alerta;
