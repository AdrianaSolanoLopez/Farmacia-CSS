//ProveedorController (para gestión de proveedores)
//Este controlador gestionará las operaciones CRUD de proveedores.

const db = require('../config/db.js');

const proveedorController = {
  // Obtener todos los proveedores
  obtenerProveedores: async (req, res) => {
    try {
      const proveedores = await db.query('SELECT * FROM Proveedores');
      res.json(proveedores.recordset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un proveedor por ID
  obtenerProveedor: async (req, res) => {
    const { id } = req.params;
    try {
      const proveedor = await db.query('SELECT * FROM Proveedores WHERE id = @id', { id });
      res.json(proveedor.recordset[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Crear un nuevo proveedor
  crearProveedor: async (req, res) => {
    const { nombre, contacto, telefono, direccion } = req.body;
    try {
      await db.query('INSERT INTO Proveedores (nombre, contacto, telefono, direccion) VALUES (@nombre, @contacto, @telefono, @direccion)', 
        { nombre, contacto, telefono, direccion });
      res.status(201).json({ mensaje: 'Proveedor creado con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar información de un proveedor
  actualizarProveedor: async (req, res) => {
    const { id } = req.params;
    const { nombre, contacto, telefono, direccion } = req.body;
    try {
      await db.query('UPDATE Proveedores SET nombre = @nombre, contacto = @contacto, telefono = @telefono, direccion = @direccion WHERE id = @id', 
        { id, nombre, contacto, telefono, direccion });
      res.json({ mensaje: 'Proveedor actualizado con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar un proveedor
  eliminarProveedor: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM Proveedores WHERE id = @id', { id });
      res.json({ mensaje: 'Proveedor eliminado con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = proveedorController;

