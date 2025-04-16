//7. Controlador: Ajustes de Inventario
//Este módulo permite registrar aumentos o disminuciones de stock por causas distintas a ventas o devoluciones: errores, pérdidas, inventarios físicos, entre otros.
//Este controlador Registrar un ajuste (positivo o negativo) de inventario
//Asociar el ajuste a un lote, producto y motivo, Ver el historial de ajustes realizados

const db = require('../db');

// Crear un ajuste de inventario
exports.crearAjuste = async (req, res) => {
  const { producto_id, lote_id, cantidad, tipo_ajuste, motivo, usuario_id } = req.body;

  try {
    // Insertar el ajuste en la tabla de ajustes
    await db.query(`
      INSERT INTO AjustesInventario (producto_id, lote_id, cantidad, tipo_ajuste, motivo, fecha, usuario_id)
      VALUES (@producto_id, @lote_id, @cantidad, @tipo_ajuste, @motivo, GETDATE(), @usuario_id)
    `, { producto_id, lote_id, cantidad, tipo_ajuste, motivo, usuario_id });

    // Actualizar la cantidad en el lote
    const operador = tipo_ajuste === 'positivo' ? '+' : '-';

    await db.query(`
      UPDATE Lotes
      SET cantidad_disponible = cantidad_disponible ${operador} @cantidad
      WHERE id = @lote_id
    `, { cantidad });

    res.status(201).json({ message: 'Ajuste registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar todos los ajustes de inventario
exports.getAjustes = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT A.*, P.nombre AS producto, L.numero_lote
      FROM AjustesInventario A
      JOIN Productos P ON A.producto_id = P.id
      JOIN Lotes L ON A.lote_id = L.id
      ORDER BY A.fecha DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener ajustes por producto
exports.getAjustesPorProducto = async (req, res) => {
  const { producto_id } = req.params;

  try {
    const result = await db.query(`
      SELECT A.*, L.numero_lote
      FROM AjustesInventario A
      JOIN Lotes L ON A.lote_id = L.id
      WHERE A.producto_id = @producto_id
      ORDER BY A.fecha DESC
    `, { producto_id });

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Consideraciones: tipo_ajuste puede ser "positivo" o "negativo" (validar en frontend y backend).
//Se registra el usuario_id para saber quién hizo el ajuste.
//Muy útil para auditorías o ajustes manuales.