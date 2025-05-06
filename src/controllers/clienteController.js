import sql from 'mssql';
import pool from '../config/db.js';

const ClienteController = {
  // Crear nuevo cliente
  crearCliente: async (req, res) => {
    const { nombre, documento, telefono, correo, direccion } = req.body;

    try {
      const existe = await pool.request()
        .input('documento', sql.NVarChar, documento)
        .query('SELECT id FROM Clientes WHERE documento = @documento');

      if (existe.recordset.length > 0) {
        return res.status(400).json({ message: 'Ya existe un cliente con ese documento.' });
      }

      const resultado = await pool.request()
        .input('nombre', sql.NVarChar, nombre)
        .input('documento', sql.NVarChar, documento)
        .input('telefono', sql.NVarChar, telefono)
        .input('correo', sql.NVarChar, correo)
        .input('direccion', sql.NVarChar, direccion)
        .query(`
          INSERT INTO Clientes (nombre, documento, telefono, correo, direccion, fecha_registro, estado)
          OUTPUT INSERTED.id
          VALUES (@nombre, @documento, @telefono, @correo, @direccion, GETDATE(), 'activo')
        `);

      res.status(201).json({ message: 'Cliente creado correctamente', cliente_id: resultado.recordset[0].id });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      res.status(500).json({ message: 'Error al crear cliente', error: error.message });
    }
  },

  // Obtener todos los clientes activos
  obtenerClientes: async (req, res) => {
    try {
      const resultado = await pool.request().query(`
        SELECT id, nombre, documento, telefono, correo, direccion, fecha_registro 
        FROM Clientes 
        WHERE estado = 'activo' 
        ORDER BY nombre
      `);
      res.json(resultado.recordset);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
    }
  },

  // Obtener cliente por ID
  obtenerClientePorId: async (req, res) => {
    const { id } = req.params;

    try {
      const resultado = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id, nombre, documento, telefono, correo, direccion, fecha_registro, estado FROM Clientes WHERE id = @id');

      if (resultado.recordset.length === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      res.json(resultado.recordset[0]);
    } catch (error) {
      console.error('Error al obtener cliente por ID:', error);
      res.status(500).json({ message: 'Error al obtener cliente', error: error.message });
    }
  },

  // Actualizar cliente
  actualizarCliente: async (req, res) => {
    const { id } = req.params;
    const { nombre, documento, telefono, correo, direccion } = req.body;

    try {
      const existe = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id FROM Clientes WHERE id = @id');

      if (existe.recordset.length === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .input('nombre', sql.NVarChar, nombre)
        .input('documento', sql.NVarChar, documento)
        .input('telefono', sql.NVarChar, telefono)
        .input('correo', sql.NVarChar, correo)
        .input('direccion', sql.NVarChar, direccion)
        .query(`
          UPDATE Clientes
          SET nombre = @nombre,
              documento = @documento,
              telefono = @telefono,
              correo = @correo,
              direccion = @direccion
          WHERE id = @id
        `);

      res.json({ message: 'Cliente actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      res.status(500).json({ message: 'Error al actualizar cliente', error: error.message });
    }
  },

  // Eliminar (desactivar) cliente
  eliminarCliente: async (req, res) => {
    const { id } = req.params;

    try {
      const existe = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id FROM Clientes WHERE id = @id AND estado = \'activo\'');

      if (existe.recordset.length === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado o ya está inactivo' });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .query("UPDATE Clientes SET estado = 'inactivo' WHERE id = @id");

      res.json({ message: 'Cliente desactivado correctamente' });
    } catch (error) {
      console.error('Error al desactivar cliente:', error);
      res.status(500).json({ message: 'Error al desactivar cliente', error: error.message });
    }
  }
};

export default ClienteController;
