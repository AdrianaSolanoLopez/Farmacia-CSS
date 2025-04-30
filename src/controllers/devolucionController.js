//4. Controlador: Devoluciones de Productos
//Este controlador se encargará de: Registrar una devolución (cliente o interna)
//Restaurar el stock en el lote correspondiente, Registrar el motivo y tipo de devolución
//Consultar historial de devoluciones.
//Consideraciones del flujo:Se registra quién devuelve y por qué (cliente o devolución interna).
//Se identifica de qué venta y lote proviene el producto (si aplica).
//Se suma nuevamente al stock del lote si es aceptada. Se lleva registro del motivo y estado.

// src/controllers/devolucionesController.js
const db = require('../config/db.js');
const moment = require('moment');

exports.registrarDevolucion = async (req, res) => {
  const { venta_id, producto_id, lote_id, cantidad, motivo, tipo } = req.body;

  // Validación de campos obligatorios
  if (!venta_id || !producto_id || !lote_id || !cantidad || !motivo || !tipo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // Validar existencia del lote y stock disponible
    const loteResult = await db.query(`SELECT cantidad_disponible FROM Lotes WHERE id = @lote_id`, { lote_id });

    if (loteResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Lote no encontrado.' });
    }

    // Verificar que la cantidad de devolución no exceda el stock disponible
    const cantidadDisponible = loteResult.recordset[0].cantidad_disponible;
    if (cantidad > cantidadDisponible) {
      return res.status(400).json({ error: 'La cantidad a devolver no puede ser mayor que el stock disponible en el lote.' });
    }

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
      fecha: moment.utc().format('YYYY-MM-DD HH:mm:ss')
    });

    const devolucion_id = result.recordset[0].id;

    // Actualizar stock del lote
    await db.query(`
      UPDATE Lotes
      SET cantidad_disponible = cantidad_disponible + @cantidad
      WHERE id = @lote_id
    `, {
      cantidad,
      lote_id
    });

    res.json({ message: '✅ Devolución registrada con éxito.', devolucion_id });
  } catch (error) {
    console.error('❌ Error al registrar devolución:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar devolución.' });
  }
};

exports.getHistorialDevoluciones = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
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
      ORDER BY d.fecha DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener historial de devoluciones:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener historial de devoluciones.' });
  }
};

//Ejemplos de uso de campos:
// Campo	Uso
//tipo	"cliente" o "interna" (si es por mal estado o ajuste interno)
//motivo	"producto vencido", "cliente no lo quiso", "defecto", etc.
//venta_id	Referencia a una venta (opcional si no es devolución del cliente)