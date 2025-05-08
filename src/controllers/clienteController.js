import { sql, executeQuery } from '../config/db.js';

export const crearCliente = async (req, res) => {
  const { nombre, documento, telefono, correo, direccion } = req.body;

  // Validación mejorada
  if (!documento || !nombre) {
    return res.status(400).json({
      success: false,
      message: 'Documento y nombre son campos obligatorios'
    });
  }

  try {
    // Verificar existencia usando executeQuery
    const existe = await executeQuery(
      'SELECT id FROM Clientes WHERE documento = @documento',
      [{ name: 'documento', value: documento, type: sql.NVarChar(50) }]
    );

    if (existe.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con ese documento'
      });
    }

    // Crear cliente con transacción
    const result = await executeQuery(
      `INSERT INTO Clientes 
       (nombre, documento, telefono, correo, direccion, fecha_registro, estado)
       OUTPUT INSERTED.id
       VALUES (@nombre, @documento, @telefono, @correo, @direccion, GETDATE(), 'activo')`,
      [
        { name: 'nombre', value: nombre, type: sql.NVarChar(100) },
        { name: 'documento', value: documento, type: sql.NVarChar(50) },
        { name: 'telefono', value: telefono || null, type: sql.NVarChar(20) },
        { name: 'correo', value: correo || null, type: sql.NVarChar(100) },
        { name: 'direccion', value: direccion || null, type: sql.NVarChar(200) }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      data: {
        id: result.recordset[0].id,
        documento,
        nombre
      }
    });
  } catch (error) {
    console.error('Error en crearCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerClientes = async (req, res) => {
  try {
    const { estado = 'activo' } = req.query; // Filtro opcional

    const result = await executeQuery(
      `SELECT 
        id, nombre, documento, telefono, correo, 
        direccion, FORMAT(fecha_registro, 'yyyy-MM-dd') AS fecha_registro 
       FROM Clientes 
       WHERE estado = @estado
       ORDER BY nombre`,
      [{ name: 'estado', value: estado, type: sql.NVarChar(20) }]
    );

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        estadoFiltrado: estado
      }
    });
  } catch (error) {
    console.error('Error en obtenerClientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
};

export const obtenerClientePorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await executeQuery(
      `SELECT 
        id, nombre, documento, telefono, correo,
        direccion, FORMAT(fecha_registro, 'yyyy-MM-dd') AS fecha_registro, estado
       FROM Clientes 
       WHERE id = @id`,
      [{ name: 'id', value: parseInt(id), type: sql.Int }]
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en obtenerClientePorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente'
    });
  }
};

export const actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, documento, telefono, correo, direccion } = req.body;

  try {
    // Verificar existencia
    const existe = await executeQuery(
      'SELECT id FROM Clientes WHERE id = @id',
      [{ name: 'id', value: parseInt(id), type: sql.Int }]
    );

    if (existe.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Actualizar con validación de campos
    await executeQuery(
      `UPDATE Clientes
       SET 
         nombre = @nombre,
         documento = @documento,
         telefono = @telefono,
         correo = @correo,
         direccion = @direccion
       WHERE id = @id`,
      [
        { name: 'id', value: parseInt(id), type: sql.Int },
        { name: 'nombre', value: nombre, type: sql.NVarChar(100) },
        { name: 'documento', value: documento, type: sql.NVarChar(50) },
        { name: 'telefono', value: telefono || null, type: sql.NVarChar(20) },
        { name: 'correo', value: correo || null, type: sql.NVarChar(100) },
        { name: 'direccion', value: direccion || null, type: sql.NVarChar(200) }
      ]
    );

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente'
    });
  } catch (error) {
    console.error('Error en actualizarCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente'
    });
  }
};

export const eliminarCliente = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar existencia
    const existe = await executeQuery(
      'SELECT id FROM Clientes WHERE id = @id AND estado = \'activo\'',
      [{ name: 'id', value: parseInt(id), type: sql.Int }]
    );

    if (existe.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o ya está inactivo'
      });
    }

    // Desactivar cliente
    await executeQuery(
      'UPDATE Clientes SET estado = \'inactivo\' WHERE id = @id',
      [{ name: 'id', value: parseInt(id), type: sql.Int }]
    );

    res.json({
      success: true,
      message: 'Cliente desactivado correctamente'
    });
  } catch (error) {
    console.error('Error en eliminarCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar cliente'
    });
  }
};