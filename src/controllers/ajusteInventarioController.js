// src/controllers/ajusteInventarioController.js
import sql, { pool } from '../config/db.js'; // Importar conexión y tipo SQL

// Obtener todos los ajustes de inventario
export const obtenerAjustes = async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT ai.id, ai.productoId, p.nombre AS nombreProducto, ai.cantidad, ai.motivo, ai.fecha
      FROM AjustesInventario ai
      INNER JOIN Productos p ON ai.productoId = p.id
      ORDER BY ai.fecha DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener ajustes:', error);
    res.status(500).json({ message: 'Error al obtener los ajustes de inventario' });
  }
};

// Registrar un nuevo ajuste de inventario
export const registrarAjuste = async (req, res) => {
  const { productoId, cantidad, motivo } = req.body;

  if (!productoId || cantidad === undefined || !motivo) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    const request = pool.request();
    request.input('productoId', sql.Int, productoId);
    request.input('cantidad', sql.Int, cantidad);
    request.input('motivo', sql.VarChar, motivo);

    await request.query(`
      INSERT INTO AjustesInventario (productoId, cantidad, motivo, fecha)
      VALUES (@productoId, @cantidad, @motivo, GETDATE());
    `);

    res.status(201).json({ message: 'Ajuste de inventario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar ajuste:', error);
    res.status(500).json({ message: 'Error al registrar el ajuste de inventario' });
  }
};
