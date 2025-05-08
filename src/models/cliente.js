//7. Modelo: Cliente
//Este modelo permite registrar a los clientes, en caso de que quieras guardar datos de quienes compran medicamentos.

// models/Cliente.js

const db = require('../config/db');

const Cliente = {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM Clientes');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener los clientes: ' + error.message);
    }
  },
  async getById(id) {
    try {
      const result = await db.query('SELECT * FROM Clientes WHERE id = @id', { id });
      return result.recordset[0];
    } catch (error) {
      throw new Error('Error al obtener el cliente: ' + error.message);
    }
  },
  async create(cliente) {
    const { nombre, email, telefono } = cliente;
    try {
      const result = await db.query(`
        INSERT INTO Clientes (nombre, email, telefono)
        VALUES (@nombre, @email, @telefono)
      `, { nombre, email, telefono });
      return result;
    } catch (error) {
      throw new Error('Error al crear el cliente: ' + error.message);
    }
  },
  async update(id, cliente) {
    const { nombre, email, telefono } = cliente;
    try {
      const result = await db.query(`
        UPDATE Clientes
        SET nombre = @nombre, email = @email, telefono = @telefono
        WHERE id = @id
      `, { id, nombre, email, telefono });
      return result;
    } catch (error) {
      throw new Error('Error al actualizar el cliente: ' + error.message);
    }
  },
  async delete(id) {
    try {
      const result = await db.query('DELETE FROM Clientes WHERE id = @id', { id });
      return result;
    } catch (error) {
      throw new Error('Error al eliminar el cliente: ' + error.message);
    }
  }
};

module.exports = Cliente;
