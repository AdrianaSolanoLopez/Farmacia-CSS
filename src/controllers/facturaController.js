//6. Controlador: Facturación
//Este flujo se encarga de registrar una venta, calcular totales, aplicar descuentos (si los hay), enlazar con cliente y lotes de productos, y finalmente generar la factura.
//Crear una factura con su detalle de productos, Obtener facturas por cliente o por fecha
//Consultar una factura individual, Anular o eliminar una factura (si aplica).

const db = require('../db');

// Crear nueva factura con sus detalles
exports.crearFactura = async (req, res) => {
  const { cliente_id, medio_pago, total, productos } = req.body;

  const transaction = new db.Transaction();

  try {
    await transaction.begin();

    // Insertar encabezado de factura
    const result = await transaction.request().query(`
      INSERT INTO Facturas (cliente_id, medio_pago, total, fecha_emision)
      OUTPUT INSERTED.id
      VALUES (@cliente_id, @medio_pago, @total, GETDATE())
    `, { cliente_id, medio_pago, total });

    const facturaId = result.recordset[0].id;

    // Insertar detalle de factura (productos vendidos)
    for (const item of productos) {
      const { producto_id, lote_id, cantidad, precio_unitario } = item;

      // Insertar detalle
      await transaction.request().query(`
        INSERT INTO DetalleFactura (factura_id, producto_id, lote_id, cantidad, precio_unitario)
        VALUES (@facturaId, @producto_id, @lote_id, @cantidad, @precio_unitario)
      `, { facturaId, producto_id, lote_id, cantidad, precio_unitario });

      // Actualizar inventario del lote
      await transaction.request().query(`
        UPDATE Lotes
        SET cantidad_disponible = cantidad_disponible - @cantidad
        WHERE id = @lote_id
      `, { cantidad });
    }

    await transaction.commit();
    res.status(201).json({ message: 'Factura creada con éxito', factura_id: facturaId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las facturas
exports.getFacturas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT F.id, F.fecha_emision, F.total, F.medio_pago, C.nombre AS cliente
      FROM Facturas F
      JOIN Clientes C ON F.cliente_id = C.id
      ORDER BY F.fecha_emision DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una factura por ID
exports.getFacturaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const encabezado = await db.query(`
      SELECT F.*, C.nombre AS cliente_nombre
      FROM Facturas F
      JOIN Clientes C ON F.cliente_id = C.id
      WHERE F.id = @id
    `, { id });

    if (encabezado.recordset.length === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const detalle = await db.query(`
      SELECT D.*, P.nombre AS producto_nombre
      FROM DetalleFactura D
      JOIN Productos P ON D.producto_id = P.id
      WHERE D.factura_id = @id
    `, { id });

    res.json({
      ...encabezado.recordset[0],
      detalle: detalle.recordset,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Sugerencias adicionales: El cálculo de total puede hacerse en el backend por seguridad, multiplicando precio x cantidad.
//Se puede agregar una columna anulada para permitir anulación lógica.
//Este controlador se conecta directamente con Clientes, Productos, Lotes y Inventario.
