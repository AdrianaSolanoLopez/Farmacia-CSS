import { executeQuery, sql, getPool } from '../config/db.js';

export const registrarOrdenCompra = async (req, res) => {
  const { proveedor_id, fecha, productos, usuario_id, notas } = req.body;

  // Validaciones mejoradas
  if (!proveedor_id || !fecha || !usuario_id || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos o inválidos',
      requiredFields: ['proveedor_id', 'fecha', 'productos', 'usuario_id'],
      received: req.body
    });
  }

  // Validar productos
  const productosInvalidos = productos.filter(p =>
    !p.producto_id || !p.cantidad || !p.costo_unitario || p.cantidad <= 0 || p.costo_unitario <= 0
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
      // 1. Insertar orden de compra
      const ordenResult = await executeQuery(
        `INSERT INTO OrdenesCompra 
         (proveedor_id, fecha, usuario_id, notas, estado)
         OUTPUT INSERTED.id, INSERTED.fecha
         VALUES (@proveedor_id, @fecha, @usuario_id, @notas, 'pendiente')`,
        [
          { name: 'proveedor_id', value: proveedor_id, type: sql.Int },
          { name: 'fecha', value: new Date(fecha), type: sql.DateTime },
          { name: 'usuario_id', value: usuario_id, type: sql.Int },
          { name: 'notas', value: notas || null, type: sql.NVarChar(500) }
        ],
        { transaction }
      );

      const ordenId = ordenResult.recordset[0].id;
      const productosNoRegistrados = [];

      // 2. Insertar detalles
      for (const producto of productos) {
        const { producto_id, cantidad, costo_unitario } = producto;

        try {
          await executeQuery(
            `INSERT INTO DetallesOrdenCompra 
             (orden_id, producto_id, cantidad, costo_unitario)
             VALUES (@orden_id, @producto_id, @cantidad, @costo_unitario)`,
            [
              { name: 'orden_id', value: ordenId, type: sql.Int },
              { name: 'producto_id', value: producto_id, type: sql.Int },
              { name: 'cantidad', value: cantidad, type: sql.Decimal(10, 2) },
              { name: 'costo_unitario', value: costo_unitario, type: sql.Decimal(10, 2) }
            ],
            { transaction }
          );
        } catch (error) {
          productosNoRegistrados.push({
            producto_id,
            error: 'No se pudo registrar el producto'
          });
          console.error(`Error al registrar producto ${producto_id}:`, error);
        }
      }

      if (productosNoRegistrados.length === productos.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'No se pudo registrar ningún producto'
        });
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Orden de compra registrada con éxito',
        data: {
          orden_id: ordenId,
          fecha: ordenResult.recordset[0].fecha,
          productos_registrados: productos.length - productosNoRegistrados.length,
          productos_no_registrados: productosNoRegistrados.length > 0 ? productosNoRegistrados : null
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en registrarOrdenCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar orden de compra',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerOrdenesCompra = async (req, res) => {
  try {
    const { estado, proveedor_id, desde, hasta } = req.query;

    const whereConditions = [];
    const params = [];

    if (estado) {
      whereConditions.push('oc.estado = @estado');
      params.push({ name: 'estado', value: estado, type: sql.NVarChar(20) });
    }

    if (proveedor_id) {
      whereConditions.push('oc.proveedor_id = @proveedor_id');
      params.push({ name: 'proveedor_id', value: proveedor_id, type: sql.Int });
    }

    if (desde && hasta) {
      whereConditions.push('oc.fecha BETWEEN @desde AND @hasta');
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
        oc.id,
        FORMAT(oc.fecha, 'yyyy-MM-dd') AS fecha,
        oc.estado,
        p.nombre AS proveedor,
        u.nombre AS usuario,
        oc.notas,
        (SELECT SUM(d.cantidad * d.costo_unitario) 
         FROM DetallesOrdenCompra d 
         WHERE d.orden_id = oc.id) AS total
      FROM OrdenesCompra oc
      JOIN Proveedores p ON oc.proveedor_id = p.id
      JOIN Usuarios u ON oc.usuario_id = u.id
      ${whereClause}
      ORDER BY oc.fecha DESC
    `, params);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        filters: {
          estado,
          proveedor_id,
          desde,
          hasta
        }
      }
    });
  } catch (error) {
    console.error('Error en obtenerOrdenesCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de compra'
    });
  }
};

export const obtenerOrdenPorId = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener orden principal
    const orden = await executeQuery(`
      SELECT 
        oc.*,
        p.nombre AS proveedor,
        p.contacto,
        p.telefono,
        u.nombre AS usuario
      FROM OrdenesCompra oc
      JOIN Proveedores p ON oc.proveedor_id = p.id
      JOIN Usuarios u ON oc.usuario_id = u.id
      WHERE oc.id = @id
    `, [{ name: 'id', value: id, type: sql.Int }]);

    if (orden.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }

    // Obtener detalles
    const detalles = await executeQuery(`
      SELECT 
        d.*,
        p.nombre AS producto,
        p.unidad_medida,
        (d.cantidad * d.costo_unitario) AS subtotal
      FROM DetallesOrdenCompra d
      JOIN Productos p ON d.producto_id = p.id
      WHERE d.orden_id = @id
      ORDER BY d.id
    `, [{ name: 'id', value: id, type: sql.Int }]);

    // Calcular total
    const total = detalles.recordset.reduce(
      (sum, item) => sum + (item.cantidad * item.costo_unitario),
      0
    );

    res.json({
      success: true,
      data: {
        ...orden.recordset[0],
        detalles: detalles.recordset,
        total: parseFloat(total.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error en obtenerOrdenPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden de compra'
    });
  }
};

export const actualizarOrdenCompra = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // Validar estado
    const estadosPermitidos = ['pendiente', 'aprobada', 'rechazada', 'completada'];
    if (!estado || !estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        estadosPermitidos
      });
    }

    const result = await executeQuery(
      `UPDATE OrdenesCompra SET estado = @estado WHERE id = @id`,
      [
        { name: 'id', value: id, type: sql.Int },
        { name: 'estado', value: estado, type: sql.NVarChar(20) }
      ]
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Orden de compra actualizada',
      data: { id, estado }
    });
  } catch (error) {
    console.error('Error en actualizarOrdenCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar orden de compra'
    });
  }
};

export const eliminarOrdenCompra = async (req, res) => {
  const { id } = req.params;

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();

    try {
      // 1. Verificar si la orden existe y está en estado pendiente
      const orden = await executeQuery(
        `SELECT estado FROM OrdenesCompra WHERE id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      if (orden.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }

      if (orden.recordset[0].estado !== 'pendiente') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar órdenes en estado pendiente'
        });
      }

      // 2. Eliminar detalles
      await executeQuery(
        `DELETE FROM DetallesOrdenCompra WHERE orden_id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      // 3. Eliminar orden
      await executeQuery(
        `DELETE FROM OrdenesCompra WHERE id = @id`,
        [{ name: 'id', value: id, type: sql.Int }],
        { transaction }
      );

      await transaction.commit();

      res.json({
        success: true,
        message: 'Orden de compra eliminada',
        data: { id }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en eliminarOrdenCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar orden de compra'
    });
  }
};