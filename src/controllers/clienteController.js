//5. Controlador: Gestión de Clientes
//Este controlador se encargará de: Registrar nuevos clientes
//Consultar clientes existentes, Actualizar información de clientes
//Eliminar (o desactivar) clientes si es necesario.

const db = require('../db');

// Crear nuevo cliente
exports.crearCliente = async (req, res) => {
  const { nombre, cedula, telefono, email, direccion } = req.body;

  try {
    const result = await db.query(`
      INSERT INTO Clientes (nombre, cedula, telefono, email, direccion, fecha_registro)
      OUTPUT INSERTED.id
      VALUES (@nombre, @cedula, @telefono, @email, @direccion, GETDATE())
    `, { nombre, cedula, telefono, email, direccion });

    res.status(201).json({ message: 'Cliente creado con éxito.', cliente_id: result.recordset[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los clientes
exports.getClientes = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM Clientes ORDER BY nombre ASC`);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener cliente por ID
exports.getClientePorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`SELECT * FROM Clientes WHERE id = @id`, { id });

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, telefono, email, direccion } = req.body;

  try {
    await db.query(`
      UPDATE Clientes
      SET nombre = @nombre,
          cedula = @cedula,
          telefono = @telefono,
          email = @email,
          direccion = @direccion
      WHERE id = @id
    `, { id, nombre, cedula, telefono, email, direccion });

    res.json({ message: 'Cliente actualizado con éxito.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar cliente (opcional: desactivar)
exports.eliminarCliente = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM Clientes WHERE id = @id`, { id });
    res.json({ message: 'Cliente eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Se puede desactivar clientes en lugar de eliminarlos si prefiere mantener el historial.
//Se puede integrar con el flujo de ventas para traer datos del cliente automáticamente si tiene compras anteriores.