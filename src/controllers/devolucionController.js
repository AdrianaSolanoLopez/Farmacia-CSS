//4. Controlador: Devoluciones de Productos
//Este controlador se encargará de: Registrar una devolución (cliente o interna)
//Restaurar el stock en el lote correspondiente, Registrar el motivo y tipo de devolución
//Consultar historial de devoluciones.
//Consideraciones del flujo:Se registra quién devuelve y por qué (cliente o devolución interna).
//Se identifica de qué venta y lote proviene el producto (si aplica).
//Se suma nuevamente al stock del lote si es aceptada. Se lleva registro del motivo y estado.

const db = require('../db');
const moment = require('moment');

// Registrar una devolución
exports.registrarDevolucion = async (req, res) => {
  const { venta_id, producto_id, lote_id, cantidad, motivo, tipo } = req.body;

  try {
    // Insertar devolución
    const result = await db.query(`
      INSERT INTO Devoluciones (venta_id, producto_id, lote_id, cantidad, motivo, tipo, fecha)
      OUTPUT INSERTED.id
      VALUES (@venta_id, @producto_id, @lote_id, @cantidad, @motivo, @tipo, @fecha)
    `, {
      venta_id,
      producto_id,
      lote_id,
      cantidad,
      motivo,
      tipo,
      fecha: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    const devolucion_id = result.recordset[0].id;

    // Sumar al lote si se acepta la devolución (por defecto todas se aceptan)
    await db.query(`
      UPDATE Lotes
      SET cantidad_disponible = cantidad_disponible + @cantidad
      WHERE id = @lote_id
    `, {
      cantidad,
      lote_id
    });

    res.json({ message: 'Devolución registrada con éxito.', devolucion_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ver historial de devoluciones
exports.getHistorialDevoluciones = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.id, d.fecha, p.nombre AS producto, d.cantidad, d.motivo, d.tipo, l.numero_lote, c.nombre AS cliente
      FROM Devoluciones d
      LEFT JOIN Productos p ON d.producto_id = p.id
      LEFT JOIN Lotes l ON d.lote_id = l.id
      LEFT JOIN Ventas v ON d.venta_id = v.id
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      ORDER BY d.fecha DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Ejemplos de uso de campos:
// Campo	Uso
//tipo	"cliente" o "interna" (si es por mal estado o ajuste interno)
//motivo	"producto vencido", "cliente no lo quiso", "defecto", etc.
//venta_id	Referencia a una venta (opcional si no es devolución del cliente)