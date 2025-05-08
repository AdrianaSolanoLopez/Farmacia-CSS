import { executeQuery, sql, getPool } from '../config/db.js';

export const registrarOrdenSalida = async (req, res) => {
  const { cliente_id, fecha, productos, usuario_id, notas } = req.body;

  // Validaciones mejoradas
  if (!cliente_id || !fecha || !usuario_id || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos o inválidos',
      requiredFields: ['cliente_id', 'fecha', 'productos', 'usuario_id'],
      received: req.body
    });
  }

  // Validar productos
  const productosInvalidos = productos.filter(p =>
    !p.producto_id || !p.cantidad || !p.precio_unitario || p.cantidad <= 0 || p.precio_unitario <= 0
  );

  if (productosInvalidos.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Algunos productos tienen datos inválidos',
      productosInvalidos
    });
  }

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();

    try {
      // 1. Verificar stock disponible para todos los productos
      for (const producto of productos) {
        const stockResult = await executeQuery(
          `SELECT SUM(cantidad_disponible) AS stock 
           FROM Lotes 
           WHERE producto_id = @producto_id
           GROUP BY producto_id`,
          [{ name: 'producto_id', value: producto.producto_id, type: sql.Int }],
          { transaction }
        );

        const stockDisponible = stockResult.recordset[0]?.stock || 0;
        if (stockDisponible < producto.cantidad) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para el producto ${producto.producto_id}`,
            producto_id: producto.producto_id,
            stock_disponible: stockDisponible,
            cantidad_solicitada: producto.cantidad
          });
        }
      }

      // 2. Insertar orden de salida
      const ordenResult = await executeQuery(
        `INSERT INTO OrdenesSalida 
         (cliente_id, fecha, usuario_id, notas, estado)
         OUTPUT INSERTED.id, INSERTED.fecha
         VALUES (@cliente_id, @fecha, @usuario_id, @notas, 'pendiente')`,
        [
          { name: 'cliente_id', value: cliente_id, type: sql.Int },
          { name: 'fecha', value: new Date(fecha), type: sql.DateTime },
          { name: 'usuario_id', value: usuario_id, type: sql.Int },
          { name: 'notas', value: notas || null, type: sql.NVarChar(500) }
        ],
        { transaction }
      );

      const ordenId = ordenResult.recordset[0].id;
      let totalOrden = 0;

      // 3. Procesar cada producto (método FIFO)
      for (const producto of productos) {
        const { producto_id, cantidad: cantidadNecesaria, precio_unitario } = producto;
        let cantidadRestante = cantidadNecesaria;

        // Obtener lotes ordenados por fecha de vencimiento (FIFO)
        const lotes = await executeQuery(
          `SELECT id, cantidad_disponible 
           FROM Lotes 
           WHERE producto_id = @producto_id AND cantidad_disponible > 0
           ORDER BY fecha_vencimiento ASC`,
          [{ name: 'producto_id', value: producto_id, type: sql.Int }],
          { transaction }
        );

        // Procesar cada lote hasta cubrir la cantidad necesaria
        for (const lote of lotes.recordset) {
          if (cantidadRestante <= 0) break;

          const cantidadUsar = Math.min(cantidadRestante, lote.cantidad_disponible);

          // Insertar detalle de orden
          await executeQuery(
            `INSERT INTO DetalleOrdenSalida 
             (orden_id, producto_id, lote_id, cantidad, precio_unitario)
             VALUES (@orden_id, @producto_id, @lote_id, @cantidad, @precio_unitario)`,
            [
              { name: 'orden_id', value: ordenId, type: sql.Int },
              { name: 'producto_id', value: producto_id, type: sql.Int },
              { name: 'lote_id', value: lote.id, type: sql.Int },
              { name: 'cantidad', value: cantidadUsar, type: sql.Decimal(10, 2) },
              { name: 'precio_unitario', value: precio_unitario, type: sql.Decimal(10, 2) }
            ],
            { transaction }
          );

          // Actualizar stock del lote
          await executeQuery(
            `UPDATE Lotes 
             SET cantidad_disponible = cantidad_disponible - @cantidad 
             WHERE id = @lote_id`,
            [
              { name: 'cantidad', value: cantidadUsar, type: sql.Decimal(10, 2) },
              { name: 'lote_id', value: lote.id, type: sql.Int }
            ],
            { transaction }
          );

          cantidadRestante -= cantidadUsar;
          totalOrden += cantidadUsar * precio_unitario;
        }
      }

      // 4. Actualizar total de la orden
      await executeQuery(
        `UPDATE OrdenesSalida SET total = @total WHERE id = @orden_id`,
        [
          { name: 'total', value: totalOrden, type: sql.Decimal(10, 2) },
          { name: 'orden_id', value: ordenId, type: sql.Int }
        ],
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Orden de salida registrada con éxito',
        data: {
          orden_id: ordenId,
          fecha: ordenResult.recordset[0].fecha,
          total: totalOrden,
          productos: productos.map(p => ({
            producto_id: p.producto_id,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario
          }))
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en registrarOrdenSalida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar orden de salida',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerOrdenesSalida = async (req, res) => {
  try {
    const { estado, cliente_id, desde, hasta } = req.query;

    const whereConditions = [];
    const params = [];

    if (estado) {
      whereConditions.push('os.estado = @estado');
      params.push({ name: 'estado', value: estado, type: sql.NVarChar(20) });
    }

    if (cliente_id) {
      whereConditions.push('os.cliente_id = @cliente_id');
      params.push({ name: 'cliente_id', value: cliente_id, type: sql.Int });
    }

    if (desde && hasta) {
      whereConditions.push('os.fecha BETWEEN @desde AND @hasta');
      params.push(
        { name: 'desde', value: desde, type: sql.DateTime },
        { name: 'hasta', value: hasta, type: sql.DateTime }
      );
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const result = await executeQuery(`
      SELECT 
        os.id,
        FORMAT(os.fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha,
        os.estado,
        os.total,
        c.nombre AS cliente,
        u.nombre AS usuario,
        os.notas
      FROM OrdenesSalida os
      JOIN Clientes c ON os.cliente_id = c.id
      JOIN Usuarios u ON os.usuario_id = u.id
      ${whereClause}
      ORDER BY os.fecha DESC
    `, params);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        filters: {
          estado,
          cliente_id,
          desde,
          hasta
        }
      }
    });
  } catch (error) {
    console.error('Error en obtenerOrdenesSalida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de salida'
    });
  }
};

export const obtenerOrdenSalidaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener orden principal
    const orden = await executeQuery(`
      SELECT 
        os.*,
        c.nombre AS cliente,
        c.documento AS cliente_documento,
        c.direccion AS cliente_direccion,
        u.nombre AS usuario
      FROM OrdenesSalida os
      JOIN Clientes c ON os.cliente_id = c.id
      JOIN Usuarios u ON os.usuario_id = u.id
      WHERE os.id = @id
    `, [{ name: 'id', value: id, type: sql.Int }]);

    if (orden.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de salida no encontrada'
      });
    }

    // Obtener detalles
    const detalles = await executeQuery(`
      SELECT 
        d.*,
        p.nombre AS producto,
        p.unidad_medida,
        l.numero_lote,
        FORMAT(l.fecha_vencimiento, 'yyyy-MM-dd') AS fecha_vencimiento,
        (d.cantidad * d.precio_unitario) AS subtotal
      FROM DetalleOrdenSalida d
      JOIN Productos p ON d.producto_id = p.id
      JOIN Lotes l ON d.lote_id = l.id
      WHERE d.orden_id = @id
      ORDER BY d.id
    `, [{ name: 'id', value: id, type: sql.Int }]);

    res.json({
      success: true,
      data: {
        ...orden.recordset[0],
        detalles: detalles.recordset
      }
    });
  } catch (error) {
    console.error('Error en obtenerOrdenSalidaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden de salida'
    });
  }
};

export const actualizarOrdenSalida = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // Validar estado
    const estadosPermitidos = ['pendiente', 'procesada', 'cancelada'];
    if (!estado || !estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        estadosPermitidos
      });
    }

    const result = await executeQuery(
      `UPDATE OrdenesSalida SET estado = @estado WHERE id = @id`,
      [
        { name: 'id', value: id, type: sql.Int },
        { name: 'estado', value: estado, type: sql.NVarChar(20) }
      ]
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de salida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Orden de salida actualizada',
      data: { id, estado }
    });
  } catch (error) {
    console.error('Error en actualizarOrdenSalida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar orden de salida'
    });
  }
};

export const eliminarOrdenSalida = async (req, res) => {
  const { id } = req.params;

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();

    try {
      // 1. Verificar si la orden existe y está en estado pendiente
      const orden = await executeQuery(
        `SELECT estado FROM OrdenesSalida WHERE id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      if (orden.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Orden de salida no encontrada'
        });
      }

      if (orden.recordset[0].estado !== 'pendiente') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar órdenes en estado pendiente'
        });
      }

      // 2. Obtener detalles para revertir stock
      const detalles = await executeQuery(
        `SELECT producto_id, lote_id, cantidad 
         FROM DetalleOrdenSalida 
         WHERE orden_id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      // 3. Revertir stock en lotes
      for (const detalle of detalles.recordset) {
        await executeQuery(
          `UPDATE Lotes 
           SET cantidad_disponible = cantidad_disponible + @cantidad 
           WHERE id = @lote_id`,
          [
            { name: 'cantidad', value: detalle.cantidad, type: sql.Decimal(10, 2) },
            { name: 'lote_id', value: detalle.lote_id, type: sql.Int }
          ],
          { transaction }
        );
      }

      // 4. Eliminar detalles
      await executeQuery(
        `DELETE FROM DetalleOrdenSalida WHERE orden_id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      // 5. Eliminar orden
      await executeQuery(
        `DELETE FROM OrdenesSalida WHERE id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      await transaction.commit();

      res.json({
        success: true,
        message: 'Orden de salida eliminada correctamente',
        data: { id }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en eliminarOrdenSalida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar orden de salida'
    });
  }
};