//2. Controlador: Inventario
//Este controlador se encargará de manejar:
//Consultas de stock actual (por producto y lote)
//Ajustes de inventario (entrada o salida manual por pérdida, daño, error, etc.)
//Consultar historial de ajustes.

const db = require('../config/db.js');
const moment = require('moment');

// Obtener stock actual de todos los productos
exports.getStockActual = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id AS producto_id, p.nombre, p.unidad_medida,
             SUM(l.cantidad_disponible) AS stock_total
      FROM Productos p
      LEFT JOIN Lotes l ON p.id = l.producto_id
      WHERE p.estado = 1
      GROUP BY p.id, p.nombre, p.unidad_medida
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener stock actual:', error);
    res.status(500).json({ error: 'Error al obtener stock actual.' });
  }
};

// Obtener stock por producto
exports.getStockByProductoId = async (req, res) => {
  const { producto_id } = req.params;
  try {
    const result = await db.query(`
      SELECT l.id AS lote_id, l.numero_lote, l.fecha_vencimiento, l.cantidad_disponible
      FROM Lotes l
      WHERE l.producto_id = @producto_id
      ORDER BY l.fecha_vencimiento ASC
    `, { producto_id });

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener stock por producto:', error);
    res.status(500).json({ error: 'Error al obtener stock por producto.' });
  }
};

// Registrar ajuste de inventario (entrada o salida manual)
exports.ajustarInventario = async (req, res) => {
  const { lote_id, tipo_ajuste, cantidad, motivo } = req.body;

  // Validación básica
  if (!lote_id || !tipo_ajuste || !cantidad || !motivo) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  if (cantidad <= 0) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser mayor que 0.' });
  }

  if (!['entrada', 'salida'].includes(tipo_ajuste)) {
    return res.status(400).json({ mensaje: 'El tipo de ajuste debe ser "entrada" o "salida".' });
  }

  try {
    // Verificar si el lote existe y obtener la cantidad disponible
    const loteResult = await db.query(`
      SELECT cantidad_disponible FROM Lotes WHERE id = @lote_id
    `, { lote_id });

    if (loteResult.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Lote no encontrado.' });
    }

    const lote = loteResult.recordset[0];
    let nuevaCantidad = lote.cantidad_disponible;

    // Verificar si hay suficiente stock para la salida
    if (tipo_ajuste === 'salida' && nuevaCantidad < 0) {
      return res.status(400).json({ mensaje: 'No hay suficiente stock para esta salida.' });
    }

    // Realizar el ajuste de inventario
    const signo = tipo_ajuste === 'entrada' ? '+' : '-';
    await db.query(`
      UPDATE Lotes
      SET cantidad_disponible = @nuevaCantidad
      WHERE id = @lote_id
    `, { nuevaCantidad, lote_id });

    // Registrar el ajuste en el historial
    await db.query(`
      INSERT INTO AjustesInventario (lote_id, tipo_ajuste, cantidad, motivo, fecha)
      VALUES (@lote_id, @tipo_ajuste, @cantidad, @motivo, @fecha)
    `, {
      lote_id,
      tipo_ajuste,
      cantidad,
      motivo,
      fecha: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    res.json({ mensaje: 'Ajuste registrado correctamente.' });
  } catch (error) {
    console.error('Error al registrar ajuste de inventario:', error);
    res.status(500).json({ error: 'Error al registrar ajuste de inventario.' });
  }
};

// Ver historial de ajustes
exports.getHistorialAjustes = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ai.id, p.nombre AS producto, l.numero_lote, ai.tipo_ajuste,
             ai.cantidad, ai.motivo, ai.fecha
      FROM AjustesInventario ai
      JOIN Lotes l ON ai.lote_id = l.id
      JOIN Productos p ON l.producto_id = p.id
      ORDER BY ai.fecha DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener historial de ajustes:', error);
    res.status(500).json({ error: 'Error al obtener historial de ajustes.' });
  }
};


//Con este controlador de Inventario, se puede consultar el 
// stock general, el stock por producto, ajustar manualmente 
// el inventario y ver los ajustes realizados.