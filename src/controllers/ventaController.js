//3. Controlador: Ventas y Facturación
//Este controlador se encargará de: Registrar una venta (afecta el inventario),
//Ver detalles de una venta, Consultar historial de ventas, Generar total por venta,
//Ver ventas por fecha.
//Estructura básica y lógica de flujo: Cuando se registra una venta: Se guarda la venta principal (fecha, cliente, total, etc.)
//Se recorren los productos vendidos: Se insertan en DetalleVenta Se descuenta la cantidad desde los lotes (priorizando los que estén más cerca de vencer: FEFO)
// Se genera la factura.

const db = require('../db');
const moment = require('moment');

// Registrar una venta con lógica FEFO y usuario
exports.registrarVenta = async (req, res) => {
  const { cliente_id, usuario_id, productos, metodo_pago } = req.body;

  try {
    let total = 0;

    productos.forEach(p => {
      total += p.precio_venta * p.cantidad;
    });

    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');

    const ventaResult = await db.query(`
      INSERT INTO Ventas (cliente_id, usuario_id, fecha, total, metodo_pago)
      OUTPUT INSERTED.id
      VALUES (@cliente_id, @usuario_id, @fecha, @total, @metodo_pago)
    `, { cliente_id, usuario_id, fecha, total, metodo_pago });

    const venta_id = ventaResult.recordset[0].id;

    for (const producto of productos) {
      const { producto_id, cantidad, precio_venta } = producto;
      let cantidadRestante = cantidad;

      const lotes = await db.query(`
        SELECT id, cantidad_disponible
        FROM Lotes
        WHERE producto_id = @producto_id AND cantidad_disponible > 0
        ORDER BY fecha_vencimiento ASC
      `, { producto_id });

      for (const lote of lotes.recordset) {
        if (cantidadRestante <= 0) break;

        const cantidadLote = Math.min(lote.cantidad_disponible, cantidadRestante);

        await db.query(`
          UPDATE Lotes
          SET cantidad_disponible = cantidad_disponible - @cantidad
          WHERE id = @lote_id
        `, { cantidad: cantidadLote, lote_id: lote.id });

        await db.query(`
          INSERT INTO DetalleVenta (venta_id, producto_id, lote_id, cantidad, precio_unitario)
          VALUES (@venta_id, @producto_id, @lote_id, @cantidad, @precio_unitario)
        `, {
          venta_id,
          producto_id,
          lote_id: lote.id,
          cantidad: cantidadLote,
          precio_unitario: precio_venta
        });

        cantidadRestante -= cantidadLote;
      }
    }

    res.json({ mensaje: 'Venta registrada exitosamente', venta_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
};

// Obtener historial completo de ventas
exports.getHistorialVentas = async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT v.id, v.fecha, v.total, v.metodo_pago, c.nombre AS cliente, u.nombre AS usuario
      FROM Ventas v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      LEFT JOIN Usuarios u ON v.usuario_id = u.id
      ORDER BY v.fecha DESC
    `);

    res.json(resultado.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de ventas' });
  }
};

// Obtener detalle de una venta
exports.getDetalleVenta = async (req, res) => {
  const { venta_id } = req.params;

  try {
    const venta = await db.query(`
      SELECT v.id, v.fecha, v.total, v.metodo_pago, c.nombre AS cliente, u.nombre AS usuario
      FROM Ventas v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      LEFT JOIN Usuarios u ON v.usuario_id = u.id
      WHERE v.id = @venta_id
    `, { venta_id });

    if (venta.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }

    const detalles = await db.query(`
      SELECT dv.cantidad, dv.precio_unitario, p.nombre AS producto, l.numero_lote, l.fecha_vencimiento
      FROM DetalleVenta dv
      JOIN Productos p ON dv.producto_id = p.id
      JOIN Lotes l ON dv.lote_id = l.id
      WHERE dv.venta_id = @venta_id
    `, { venta_id });

    res.json({ venta: venta.recordset[0], detalles: detalles.recordset });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
};

// Obtener ventas por fecha
exports.getVentasPorFecha = async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    const resultado = await db.query(`
      SELECT v.id, v.fecha, v.total, c.nombre AS cliente
      FROM Ventas v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      WHERE v.fecha BETWEEN @desde AND @hasta
      ORDER BY v.fecha DESC
    `, {
      desde: moment(desde).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      hasta: moment(hasta).endOf('day').format('YYYY-MM-DD HH:mm:ss')
    });

    res.json(resultado.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las ventas por fecha' });
  }
};

// Eliminar venta y revertir stock
exports.eliminarVenta = async (req, res) => {
  const { id } = req.params;

  try {
    const detalles = await db.query('SELECT * FROM DetalleVenta WHERE venta_id = @id', { id });

    for (const item of detalles.recordset) {
      await db.query(`
        UPDATE Lotes
        SET cantidad_disponible = cantidad_disponible + @cantidad
        WHERE id = @lote_id
      `, { cantidad: item.cantidad, lote_id: item.lote_id });
    }

    await db.query('DELETE FROM DetalleVenta WHERE venta_id = @id', { id });
    await db.query('DELETE FROM Ventas WHERE id = @id', { id });

    res.json({ mensaje: 'Venta eliminada y stock revertido correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la venta' });
  }
};


//Con esto se tiene el flujo completo para manejar ventas, desde el registro hasta el desglose detallado.