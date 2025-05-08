import { executeQuery, sql, getPool } from '../config/db.js';
import moment from 'moment';

export const registrarDevolucion = async (req, res) => {
  const { venta_id, producto_id, lote_id, cantidad, motivo, tipo } = req.body;

  // Validación mejorada
  if (!venta_id || !producto_id || !lote_id || !cantidad || !motivo || !tipo) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios',
      requiredFields: ['venta_id', 'producto_id', 'lote_id', 'cantidad', 'motivo', 'tipo']
    });
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({
      success: false,
      message: 'La cantidad debe ser un número entero positivo'
    });
  }

  try {
    // Iniciar transacción
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Validar existencia del lote
      const lote = await executeQuery(
        `SELECT cantidad_disponible FROM Lotes WHERE id = @lote_id`,
        [{ name: 'lote_id', value: lote_id, type: sql.Int }],
        { transaction }
      );

      if (lote.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Lote no encontrado'
        });
      }

      // 2. Validar relación lote-venta-producto
      const validaRelacion = await executeQuery(
        `SELECT 1 
         FROM DetalleFactura df
         JOIN Facturas f ON df.factura_id = f.id
         WHERE f.id = @venta_id 
           AND df.producto_id = @producto_id 
           AND df.lote_id = @lote_id`,
        [
          { name: 'venta_id', value: venta_id, type: sql.Int },
          { name: 'producto_id', value: producto_id, type: sql.Int },
          { name: 'lote_id', value: lote_id, type: sql.Int }
        ],
        { transaction }
      );

      if (validaRelacion.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El lote y producto no coinciden con la venta especificada'
        });
      }

      // 3. Verificar stock disponible
      const cantidadDisponible = lote.recordset[0].cantidad_disponible;
      if (cantidad > cantidadDisponible) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cantidad a devolver excede el stock disponible',
          maxPermitido: cantidadDisponible
        });
      }

      // 4. Registrar devolución
      const devolucion = await executeQuery(
        `INSERT INTO Devoluciones 
         (venta_id, producto_id, lote_id, cantidad, motivo, tipo, fecha)
         OUTPUT INSERTED.id, INSERTED.fecha
         VALUES (@venta_id, @producto_id, @lote_id, @cantidad, @motivo, @tipo, @fecha)`,
        [
          { name: 'venta_id', value: venta_id, type: sql.Int },
          { name: 'producto_id', value: producto_id, type: sql.Int },
          { name: 'lote_id', value: lote_id, type: sql.Int },
          { name: 'cantidad', value: cantidad, type: sql.Int },
          { name: 'motivo', value: motivo, type: sql.NVarChar(255) },
          { name: 'tipo', value: tipo, type: sql.NVarChar(50) },
          { name: 'fecha', value: moment.utc().toDate(), type: sql.DateTime }
        ],
        { transaction }
      );

      // 5. Actualizar stock
      await executeQuery(
        `UPDATE Lotes 
         SET cantidad_disponible = cantidad_disponible + @cantidad 
         WHERE id = @lote_id`,
        [
          { name: 'cantidad', value: cantidad, type: sql.Int },
          { name: 'lote_id', value: lote_id, type: sql.Int }
        ],
        { transaction }
      );

      // Confirmar transacción
      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Devolución registrada exitosamente',
        data: {
          id: devolucion.recordset[0].id,
          fecha: moment(devolucion.recordset[0].fecha).format('YYYY-MM-DD HH:mm:ss')
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en registrarDevolucion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar devolución',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getHistorialDevoluciones = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const result = await executeQuery(
      `SELECT 
         d.id, 
         FORMAT(d.fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha,
         p.nombre AS producto, 
         d.cantidad, 
         d.motivo, 
         d.tipo, 
         l.numero_lote, 
         c.nombre AS cliente,
         v.id AS venta_id
       FROM Devoluciones d
       LEFT JOIN Productos p ON d.producto_id = p.id
       LEFT JOIN Lotes l ON d.lote_id = l.id
       LEFT JOIN Facturas v ON d.venta_id = v.id
       LEFT JOIN Clientes c ON v.cliente_id = c.id
       ${desde && hasta ? 'WHERE d.fecha BETWEEN @desde AND @hasta' : ''}
       ORDER BY d.fecha DESC`,
      [
        { name: 'desde', value: desde, type: sql.DateTime },
        { name: 'hasta', value: hasta, type: sql.DateTime }
      ].filter(p => p.value)
    );

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        fechaConsulta: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en getHistorialDevoluciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerDevolucionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      `SELECT * FROM Devoluciones WHERE id = @id`,
      [{ name: 'id', value: id, type: sql.Int }]
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en obtenerDevolucionPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener devolución',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};