const db = require('../config/db');

const Inventario = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM Inventarios');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener los inventarios: ' + error.message);
    }
  },

  async update(id, inventario) {
    const { cantidad, producto_id } = inventario;
    try {
      const result = await db.query(`
        UPDATE Inventarios
        SET cantidad = @cantidad, producto_id = @producto_id
        WHERE id = @id
      `, { id, cantidad, producto_id });
      return result;
    } catch (error) {
      throw new Error('Error al actualizar el inventario: ' + error.message);
    }
  }
};

module.exports = Inventario;
