//7. Controlador: Ajustes de Inventario
//Este módulo permite registrar aumentos o disminuciones de stock por causas distintas a ventas o devoluciones: errores, pérdidas, inventarios físicos, entre otros.
//Este controlador Registrar un ajuste (positivo o negativo) de inventario
//Asociar el ajuste a un lote, producto y motivo, Ver el historial de ajustes realizados

import pool from '../config/db.js';


// Crear un ajuste de inventario
exports.crearAjuste = async (req, res) => {
  const { producto_id, lote_id, cantidad, tipo_ajuste, motivo, usuario_id } = req.body;

  try {
    if (!['positivo', 'negativo'].includes(tipo_ajuste)) {
      return res.status(400).json({ error: 'Tipo de ajuste inválido. Debe ser "positivo" o "negativo".' });
    }

    // Validar que el lote existe
    const loteResult = await db.query(`SELECT cantidad_disponible FROM Lotes WHERE id = @lote_id`, { lote_id });

    if (loteResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Lote no encontrado.' });
    }

    const disponible = loteResult.recordset[0].cantidad_disponible;

    if (tipo_ajuste === 'negativo' && cantidad > disponible) {
      return res.status(400).json({ error: `Cantidad insuficiente en el lote. Disponible: ${disponible}` });
    }

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
    console.error('Error al crear ajuste de inventario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
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
    console.error('Error al obtener ajustes:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Obtener ajustes por producto
exports.getAjustesPorProducto = async (req, res) => {
  const { producto_id } = req.params;

  try {
    const result = await db.query(`
      SELECT A.*, P.nombre AS producto, L.numero_lote
      FROM AjustesInventario A
      JOIN Lotes L ON A.lote_id = L.id
      JOIN Productos P ON A.producto_id = P.id
      WHERE A.producto_id = @producto_id
      ORDER BY A.fecha DESC
    `, { producto_id });

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener ajustes por producto:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

//Consideraciones: tipo_ajuste puede ser "positivo" o "negativo" (validar en frontend y backend).
//Se registra el usuario_id para saber quién hizo el ajuste.
//Muy útil para auditorías o ajustes manuales.