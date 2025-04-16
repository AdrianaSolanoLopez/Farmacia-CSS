const db = require('../db');

const Lote = {
  create: async ({ lote_id, producto_id, fecha_vencimiento, cantidad_disponible, precio_compra, observaciones }) => {
    await db.query(`
      INSERT INTO Lotes (
        lote_id, producto_id, fecha_vencimiento,
        cantidad_disponible, precio_compra, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [lote_id, producto_id, fecha_vencimiento, cantidad_disponible, precio_compra, observaciones]);

    return { lote_id, producto_id, cantidad_disponible, fecha_vencimiento };
  },

  findByProducto: async (producto_id) => {
    const [rows] = await db.query(`
      SELECT * FROM Lotes
      WHERE producto_id = ? AND estado = 1
      ORDER BY fecha_vencimiento ASC
    `, [producto_id]);

    return rows;
  }
};

module.exports = Lote;
