//10. Modelo: Devolucion
//Este modelo manejará las devoluciones de productos realizadas por los clientes.

// models/Devolucion.js

const db = require('../config/db');

const Devolucion = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM Devoluciones');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener las devoluciones: ' + error.message);
    }
  },

  async create(devolucion) {
    const { venta_id, fecha, motivo } = devolucion;
    try {
      const result = await db.query(`
        INSERT INTO Devoluciones (venta_id, fecha, motivo)
        VALUES (@venta_id, @fecha, @motivo)
      `, { venta_id, fecha, motivo });
      return result;
    } catch (error) {
      throw new Error('Error al crear la devolución: ' + error.message);
    }
  },

  async delete(id) {
    try {
      const result = await db.query('DELETE FROM Devoluciones WHERE id = @id', { id });
      return result;
    } catch (error) {
      throw new Error('Error al eliminar la devolución: ' + error.message);
    }
  }
};

module.exports = Devolucion;
