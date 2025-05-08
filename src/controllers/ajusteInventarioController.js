import { sql, executeQuery } from '../config/db.js';

export const obtenerAjustes = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ai.id, 
        ai.productoId, 
        p.nombre AS nombreProducto, 
        ai.cantidad, 
        ai.motivo, 
        FORMAT(ai.fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha
      FROM AjustesInventario ai
      INNER JOIN Productos p ON ai.productoId = p.id
      ORDER BY ai.fecha DESC
    `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en obtenerAjustes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ajustes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const registrarAjuste = async (req, res) => {
  const { productoId, cantidad, motivo } = req.body;

  // Validación mejorada
  if (!productoId || !Number.isInteger(Number(productoId))) {
    return res.status(400).json({
      success: false,
      message: 'ID de producto inválido o faltante'
    });
  }

  if (cantidad === undefined || !Number.isInteger(Number(cantidad))) {
    return res.status(400).json({
      success: false,
      message: 'Cantidad inválida o faltante'
    });
  }

  if (!motivo || motivo.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Motivo debe tener al menos 5 caracteres'
    });
  }

  try {
    await executeQuery(
      `INSERT INTO AjustesInventario 
       (productoId, cantidad, motivo, fecha)
       VALUES (@productoId, @cantidad, @motivo, GETDATE())`,
      [
        { name: 'productoId', value: parseInt(productoId), type: sql.Int },
        { name: 'cantidad', value: parseInt(cantidad), type: sql.Int },
        { name: 'motivo', value: motivo.trim(), type: sql.VarChar(255) }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Ajuste registrado exitosamente'
    });
  } catch (error) {
    console.error('Error en registrarAjuste:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar ajuste',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};