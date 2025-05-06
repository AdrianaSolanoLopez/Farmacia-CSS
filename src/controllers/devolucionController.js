// src/controllers/devolucionesController.js
const db = require('../config/db.js');
const moment = require('moment');

// Registrar una devolución
exports.registrarDevolucion = async (req, res) => {
  const { venta_id, producto_id, lote_id, cantidad, motivo, tipo } = req.body;

  // Validación de campos obligatorios
  if (!venta_id || !producto_id || !lote_id || !cantidad || !motivo || !tipo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // Validar que cantidad sea un número positivo
  if (typeof cantidad !== 'number' || cantidad <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un número positivo.' });
  }

  try {
    // Validar existencia del lote
    const loteResult = await db.query(
      `SELECT cantidad_disponible FROM Lotes WHERE id = @lote_id`,
      { lote_id }
    );

    if (loteResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Lote no encontrado.' });
    }

    // (Opcional pero recomendable) Verificar que el lote esté relacionado con la venta
    const validacionLoteVenta = await db.query(
      `SELECT * 
       FROM DetalleFactura df
       INNER JOIN Facturas f ON df.factura_id = f.id
       WHERE f.id = @venta_id AND df.producto_id = @producto_id AND df.lote_id = @lote_id`,
      { venta_id, producto_id, lote_id }
    );

    if (validacionLoteVenta.recordset.length === 0) {
      return res.status(400).json({ error: 'El lote y producto no coinciden con la venta especificada.' });
    }

    // Obtener cantidad disponible actual
    const cantidadDisponible = loteResult.recordset[0].cantidad_disponible;

    if (cantidad > cantidadDisponible) {
      return res.status(400).json({
        error: 'La cantidad a devolver no puede ser mayor que el stock disponible en el lote.'
      });
    }

    // Registrar devolución
    const devolucionResult = await db.query(
      `INSERT INTO Devoluciones 
         (venta_id, producto_id, lote_id, cantidad, motivo, tipo, fecha)
       OUTPUT INSERTED.id
       VALUES 
         (@venta_id, @producto_id, @lote_id, @cantidad, @motivo, @tipo, @fecha)`,
      {
        venta_id,
        producto_id,
        lote_id,
        cantidad,
        motivo,
        tipo,
        fecha: moment.utc().format('YYYY-MM-DD HH:mm:ss')
      }
    );

    const devolucion_id = devolucionResult.recordset[0].id;

    // Actualizar el stock del lote
    await db.query(
      `UPDATE Lotes 
       SET cantidad_disponible = cantidad_disponible + @cantidad 
       WHERE id = @lote_id`,
      { cantidad, lote_id }
    );

    res.json({ message: '✅ Devolución registrada con éxito.', devolucion_id });

  } catch (error) {
    console.error('❌ Error al registrar devolución:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar devolución.' });
  }
};

// Obtener historial de devoluciones
exports.getHistorialDevoluciones = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         d.id, 
         d.fecha, 
         p.nombre AS producto, 
         d.cantidad, 
         d.motivo, 
         d.tipo, 
         l.numero_lote, 
         c.nombre AS cliente
       FROM Devoluciones d
       LEFT JOIN Productos p ON d.producto_id = p.id
       LEFT JOIN Lotes l ON d.lote_id = l.id
       LEFT JOIN Ventas v ON d.venta_id = v.id
       LEFT JOIN Clientes c ON v.cliente_id = c.id
       ORDER BY d.fecha DESC`
    );

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener historial de devoluciones:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener historial de devoluciones.' });
  }
};
