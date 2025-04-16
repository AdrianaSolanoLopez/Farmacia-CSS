//2. Controlador: Inventario
//Este controlador se encargará de manejar:
//Consultas de stock actual (por producto y lote)
//Ajustes de inventario (entrada o salida manual por pérdida, daño, error, etc.)
//Consultar historial de ajustes.

const db = require('../db');
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

// Registrar ajuste de inventario (entrada o salida manual)
exports.ajustarInventario = async (req, res) => {
  const { lote_id, tipo_ajuste, cantidad, motivo } = req.body;

  try {
    // Actualizar cantidad en lote
    const signo = tipo_ajuste === 'entrada' ? '+' : '-';
    await db.query(`
      UPDATE Lotes
      SET cantidad_disponible = cantidad_disponible ${signo} @cantidad
      WHERE id = @lote_id
    `, { cantidad, lote_id });

    // Registrar el ajuste
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

    res.json({ message: 'Ajuste registrado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

//Con este controlador de Inventario, se puede consultar el 
// stock general, el stock por producto, ajustar manualmente 
// el inventario y ver los ajustes realizados.