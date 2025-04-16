const db = require('../db');

const Producto = {
  create: async (data) => {
    const {
      codigo_barras, nombre_producto, concentracion, forma_farmaceutica,
      presentacion, laboratorio, registro_sanitario, temperatura_id,
      proveedor_id, categoria
    } = data;

    const result = await db.query(`
      INSERT INTO Productos (
        codigo_barras, nombre_producto, concentracion, forma_farmaceutica,
        presentacion, laboratorio, registro_sanitario, temperatura_id,
        proveedor_id, categoria
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo_barras, nombre_producto, concentracion, forma_farmaceutica,
       presentacion, laboratorio, registro_sanitario, temperatura_id,
       proveedor_id, categoria]);

    return { producto_id: result.insertId, ...data };
  },

  findAllWithLotes: async () => {
    const [rows] = await db.query(`
      SELECT p.*, t.descripcion AS temperatura
      FROM Productos p
      LEFT JOIN Temperaturas t ON p.temperatura_id = t.temperatura_id
      WHERE p.estado = 1
    `);
    return rows;
  },

  update: async (id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const updates = keys.map((k) => `${k} = ?`).join(', ');
    await db.query(`UPDATE Productos SET ${updates} WHERE producto_id = ?`, [...values, id]);
    return { producto_id: id, ...data };
  },

  softDelete: async (id) => {
    await db.query(`UPDATE Productos SET estado = 0 WHERE producto_id = ?`, [id]);
  }
};

module.exports = Producto;
