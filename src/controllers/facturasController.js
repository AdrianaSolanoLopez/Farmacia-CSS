const db = require('../db');

// Generar una factura para una venta existente
exports.generarFactura = async (req, res) => {
  const { venta_id } = req.body;

  try {
    // Verificar si la venta ya tiene factura
    const existe = await db.query('SELECT * FROM Facturas WHERE venta_id = @venta_id', { venta_id });
    if (existe.recordset.length > 0) {
      return res.status(400).json({ mensaje: 'La factura ya fue generada para esta venta' });
    }

    // Obtener la venta y sus detalles
    const venta = await db.query('SELECT * FROM Ventas WHERE id = @venta_id', { venta_id });
    const detalles = await db.query(`
      SELECT dv.*, p.nombre AS producto
      FROM DetalleVentas dv
      JOIN Lotes l ON dv.lote_id = l.id
      JOIN Productos p ON l.producto_id = p.id
      WHERE dv.venta_id = @venta_id
    `, { venta_id });

    if (venta.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }

    const total = detalles.recordset.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
    const fecha_emision = new Date();

    // Crear la factura
    const factura = await db.query(`
      INSERT INTO Facturas (venta_id, total, fecha_emision)
      OUTPUT INSERTED.id
      VALUES (@venta_id, @total, @fecha_emision)
    `, { venta_id, total, fecha_emision });

    res.status(201).json({ mensaje: 'Factura generada exitosamente', factura_id: factura.recordset[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar la factura' });
  }
};

// Obtener factura por ID
exports.obtenerFacturaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const factura = await db.query(`
      SELECT f.*, v.cliente_id, v.usuario_id, v.metodo_pago, v.fecha
      FROM Facturas f
      JOIN Ventas v ON f.venta_id = v.id
      WHERE f.id = @id
    `, { id });

    if (factura.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    const detalles = await db.query(`
      SELECT dv.*, p.nombre AS producto
      FROM DetalleVentas dv
      JOIN Lotes l ON dv.lote_id = l.id
      JOIN Productos p ON l.producto_id = p.id
      WHERE dv.venta_id = @venta_id
    `, { venta_id: factura.recordset[0].venta_id });

    res.json({
      factura: factura.recordset[0],
      detalles: detalles.recordset
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
};

// Listar todas las facturas (opcional)
exports.listarFacturas = async (req, res) => {
  try {
    const facturas = await db.query('SELECT * FROM Facturas');
    res.json(facturas.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar las facturas' });
  }
};
