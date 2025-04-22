//14. Modelo: Factura
//Representa la factura generada por una venta. Aquí se vinculan los datos del cliente, el total, la fecha, y el método de pago.

// models/Factura.js

const db = require('../config/db');

const Factura = {
  async getById(id) {
    try {
      const result = await db.query('SELECT * FROM Facturas WHERE id = @id', { id });
      return result.recordset[0];
    } catch (error) {
      throw new Error('Error al obtener la factura: ' + error.message);
    }
  },

  async create(factura) {
    const { cliente_id, total, fecha, tipo_pago } = factura;
    try {
      const result = await db.query(`
        INSERT INTO Facturas (cliente_id, total, fecha, tipo_pago)
        VALUES (@cliente_id, @total, @fecha, @tipo_pago)
      `, { cliente_id, total, fecha, tipo_pago });
      return result;
    } catch (error) {
      throw new Error('Error al crear la factura: ' + error.message);
    }
  },

  async update(id, factura) {
    const { cliente_id, total, fecha, tipo_pago } = factura;
    try {
      const result = await db.query(`
        UPDATE Facturas
        SET cliente_id = @cliente_id, total = @total, fecha = @fecha, tipo_pago = @tipo_pago
        WHERE id = @id
      `, { id, cliente_id, total, fecha, tipo_pago });
      return result;
    } catch (error) {
      throw new Error('Error al actualizar la factura: ' + error.message);
    }
  },

  async delete(id) {
    try {
      const result = await db.query('DELETE FROM Facturas WHERE id = @id', { id });
      return result;
    } catch (error) {
      throw new Error('Error al eliminar la factura: ' + error.message);
    }
  }
};

module.exports = Factura;
