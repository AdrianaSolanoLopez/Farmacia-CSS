const db = require('../config/db');

const OrdenCompra = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM OrdenesCompra');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener las órdenes de compra: ' + error.message);
    }
  },

  async create(orden) {
    const { proveedor_id, fecha, total } = orden;
    try {
      const result = await db.query(`
        INSERT INTO OrdenesCompra (proveedor_id, fecha, total)
        VALUES (@proveedor_id, @fecha, @total)
      `, { proveedor_id, fecha, total });
      return result;
    } catch (error) {
      throw new Error('Error al crear la orden de compra: ' + error.message);
    }
  }
};

module.exports = OrdenCompra;
