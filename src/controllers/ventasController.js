//11. Controlador: Registro de Ventas
//Este flujo permite registrar una venta y sus detalles, asociando cliente, productos, lotes y métodos de pago. Es crucial para actualizar el inventario y generar informes.
//Funciones clave: Registrar una nueva venta (incluye detalles)
//Obtener todas las ventas, Obtener venta por ID (con detalles)
//Eliminar venta (opcional, con lógica de reversión de stock si aplica).

const db = require('../db');

// Crear una nueva venta
exports.registrarVenta = async (req, res) => {
  const { cliente_id, usuario_id, metodo_pago, productos } = req.body;
  const fecha = new Date();

  try {
    // Crear la venta
    const venta = await db.query(`
      INSERT INTO Ventas (cliente_id, usuario_id, fecha, metodo_pago)
      OUTPUT INSERTED.id
      VALUES (@cliente_id, @usuario_id, @fecha, @metodo_pago)
    `, { cliente_id, usuario_id, fecha, metodo_pago });

    const venta_id = venta.recordset[0].id;

    // Insertar los detalles de la venta
    for (const item of productos) {
      const { lote_id, cantidad, precio_venta } = item;

      // Insertar detalle
      await db.query(`
        INSERT INTO DetalleVentas (venta_id, lote_id, cantidad, precio_venta)
        VALUES (@venta_id, @lote_id, @cantidad, @precio_venta)
      `, { venta_id, lote_id, cantidad, precio_venta });

      // Descontar del inventario (lote)
      await db.query(`
        UPDATE Lotes
        SET stock_actual = stock_actual - @cantidad
        WHERE id = @lote_id
      `, { cantidad, lote_id });
    }

    res.status(201).json({ mensaje: 'Venta registrada exitosamente', venta_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
};

// Obtener todas las ventas
exports.obtenerVentas = async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM Ventas');
    res.json(resultado.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las ventas' });
  }
};

// Obtener venta por ID (con detalles)
exports.obtenerVentaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const venta = await db.query('SELECT * FROM Ventas WHERE id = @id', { id });

    if (venta.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }

    const detalles = await db.query(`
      SELECT dv.*, p.nombre AS producto, l.fecha_vencimiento
      FROM DetalleVentas dv
      JOIN Lotes l ON dv.lote_id = l.id
      JOIN Productos p ON l.producto_id = p.id
      WHERE dv.venta_id = @id
    `, { id });

    res.json({
      venta: venta.recordset[0],
      detalles: detalles.recordset
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
};

// (Opcional) Eliminar venta y devolver stock
exports.eliminarVenta = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener detalles de la venta
    const detalles = await db.query('SELECT * FROM DetalleVentas WHERE venta_id = @id', { id });

    // Revertir el stock por cada lote
    for (const item of detalles.recordset) {
      await db.query(`
        UPDATE Lotes
        SET stock_actual = stock_actual + @cantidad
        WHERE id = @lote_id
      `, { cantidad: item.cantidad, lote_id: item.lote_id });
    }

    // Eliminar los detalles
    await db.query('DELETE FROM DetalleVentas WHERE venta_id = @id', { id });

    // Eliminar la venta
    await db.query('DELETE FROM Ventas WHERE id = @id', { id });

    res.json({ mensaje: 'Venta eliminada y stock revertido correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la venta' });
  }
};
