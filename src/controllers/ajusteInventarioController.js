// src/controllers/ajusteInventarioController.js

// Cambia el nombre de la función a registrarAjuste
export async function registrarAjuste(req, res) {
  const { producto_id, lote_id, cantidad, tipo_ajuste, motivo, usuario_id } = req.body;

  try {
    if (!['positivo', 'negativo'].includes(tipo_ajuste)) {
      return res.status(400).json({ error: 'Tipo de ajuste inválido. Debe ser "positivo" o "negativo".' });
    }

    const loteResult = await pool.request()
      .input('lote_id', lote_id)
      .query('SELECT cantidad_disponible FROM Lotes WHERE id = @lote_id');

    if (loteResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Lote no encontrado.' });
    }

    const disponible = loteResult.recordset[0].cantidad_disponible;

    if (tipo_ajuste === 'negativo' && cantidad > disponible) {
      return res.status(400).json({ error: `Cantidad insuficiente en el lote. Disponible: ${disponible}` });
    }

    // Insertar el ajuste
    await pool.request()
      .input('producto_id', producto_id)
      .input('lote_id', lote_id)
      .input('cantidad', cantidad)
      .input('tipo_ajuste', tipo_ajuste)
      .input('motivo', motivo)
      .input('usuario_id', usuario_id)
      .query(`INSERT INTO AjustesInventario (producto_id, lote_id, cantidad, tipo_ajuste, motivo, fecha, usuario_id)
              VALUES (@producto_id, @lote_id, @cantidad, @tipo_ajuste, @motivo, GETDATE(), @usuario_id)`);

    // Actualizar la cantidad en el lote
    const operador = tipo_ajuste === 'positivo' ? '+' : '-';
    await pool.request()
      .input('cantidad', cantidad)
      .input('lote_id', lote_id)
      .query(`UPDATE Lotes SET cantidad_disponible = cantidad_disponible ${operador} @cantidad WHERE id = @lote_id`);

    res.status(201).json({ message: 'Ajuste registrado correctamente' });

  } catch (error) {
    console.error('Error al crear ajuste de inventario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
