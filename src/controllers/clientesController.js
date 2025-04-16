//10. Controlador: Gestión de Clientes
//Este módulo permite registrar, actualizar, eliminar y consultar clientes en el sistema. Es importante para ventas, facturación, devoluciones, etc.
//Funciones clave: Registrar un nuevo cliente, Obtener la lista de clientes
//Obtener un cliente por ID, Actualizar un cliente, Eliminar un cliente (opcionalmente, dejarlo inactivo).

const db = require('../db');

// Crear nuevo cliente
exports.crearCliente = async (req, res) => {
  const { nombre, documento, telefono, correo, direccion } = req.body;

  try {
    await db.query(`
      INSERT INTO Clientes (nombre, documento, telefono, correo, direccion)
      VALUES (@nombre, @documento, @telefono, @correo, @direccion)
    `, { nombre, documento, telefono, correo, direccion });

    res.status(201).json({ mensaje: 'Cliente registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los clientes
exports.obtenerClientes = async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM Clientes');
    res.json(resultado.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener cliente por ID
exports.obtenerClientePorId = async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await db.query('SELECT * FROM Clientes WHERE id = @id', { id });

    if (resultado.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json(resultado.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, documento, telefono, correo, direccion } = req.body;

  try {
    await db.query(`
      UPDATE Clientes
      SET nombre = @nombre, documento = @documento, telefono = @telefono,
          correo = @correo, direccion = @direccion
      WHERE id = @id
    `, { id, nombre, documento, telefono, correo, direccion });

    res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar cliente (opcional: puedes usar estado = 'inactivo')
exports.eliminarCliente = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM Clientes WHERE id = @id', { id });
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
