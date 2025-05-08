//4. Modelo: Producto

// models/Producto.js

const db = require('../config/db');  // Importar la conexión de base de datos

// Modelo Producto
const Producto = {
  // Obtener todos los productos
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM Productos');
      return result.recordset;
    } catch (error) {
      throw new Error('Error al obtener los productos: ' + error.message);
    }
  },

  // Obtener un producto por ID
  async getById(id) {
    try {
      const result = await db.query('SELECT * FROM Productos WHERE id = @id', { id });
      return result.recordset[0];  // Solo devolver el primer producto encontrado
    } catch (error) {
      throw new Error('Error al obtener el producto: ' + error.message);
    }
  },

  // Crear un nuevo producto
  async create(producto) {
    const { nombre, descripcion, precio, stock } = producto;
    try {
      const result = await db.query(`
        INSERT INTO Productos (nombre, descripcion, precio, stock)
        VALUES (@nombre, @descripcion, @precio, @stock)
      `, { nombre, descripcion, precio, stock });
      return result;
    } catch (error) {
      throw new Error('Error al crear el producto: ' + error.message);
    }
  },

  // Actualizar un producto
  async update(id, producto) {
    const { nombre, descripcion, precio, stock } = producto;
    try {
      const result = await db.query(`
        UPDATE Productos
        SET nombre = @nombre, descripcion = @descripcion, precio = @precio, stock = @stock
        WHERE id = @id
      `, { id, nombre, descripcion, precio, stock });
      return result;
    } catch (error) {
      throw new Error('Error al actualizar el producto: ' + error.message);
    }
  },

  // Eliminar un producto
  async delete(id) {
    try {
      const result = await db.query('DELETE FROM Productos WHERE id = @id', { id });
      return result;
    } catch (error) {
      throw new Error('Error al eliminar el producto: ' + error.message);
    }
  }
};

module.exports = Producto;
