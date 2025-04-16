//5. Controlador: Gestión de Clientes
//Este controlador se encargará de: Registrar nuevos clientes
//Consultar clientes existentes, Actualizar información de clientes
//Eliminar (o desactivar) clientes si es necesario.

const db = require('../db');

// Crear nuevo cliente
exports.crearCliente = async (req, res) => {
  const { nombre, documento, telefono, correo, direccion } = req.body;

  try {
    // Verificar si ya existe un cliente con ese documento
    const existe = await db.query(`SELECT id FROM Clientes WHERE documento = @documento`, { documento });

    if (existe.recordset.length > 0) {
      return res.status(400).json({ mensaje: 'Ya existe un cliente con ese documento.' });
    }

    const resultado = await db.query(`
      INSERT INTO Clientes (nombre, documento, telefono, correo, direccion, fecha_registro, estado)
      OUTPUT INSERTED.id
      VALUES (@nombre, @documento, @telefono, @correo, @direccion, GETDATE(), 'activo')
    `, { nombre, documento, telefono, correo, direccion });

    res.status(201).json({ mensaje: 'Cliente creado correctamente', cliente_id: resultado.recordset[0].id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los clientes activos
exports.obtenerClientes = async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM Clientes WHERE estado = \'activo\' ORDER BY nombre');
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
      SET nombre = @nombre,
          documento = @documento,
          telefono = @telefono,
          correo = @correo,
          direccion = @direccion
      WHERE id = @id
    `, { id, nombre, documento, telefono, correo, direccion });

    res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar (desactivar) cliente
exports.eliminarCliente = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE Clientes SET estado = \'inactivo\' WHERE id = @id', { id });
    res.json({ mensaje: 'Cliente desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//Se puede desactivar clientes en lugar de eliminarlos si prefiere mantener el historial.
//Se puede integrar con el flujo de ventas para traer datos del cliente automáticamente si tiene compras anteriores.