//9. Controlador: Alertas de Vencimiento de Medicamentos
//Este módulo sirve para consultar productos con lotes próximos a vencer o ya vencidos, y así tomar acción oportuna (como promociones, devoluciones o ajustes de inventario).
//Se logra Listar productos con lotes que vencen en los próximos X días.
//Listar productos que ya están vencidos. Mostrar cantidad disponible por lote próximo a vencer o vencido.

const db = require('../db');

// Productos con lotes próximos a vencer
exports.getLotesPorVencer = async (req, res) => {
  const { dias_alerta } = req.body; // Ej: 30 días

  try {
    const resultado = await db.query(`
      SELECT 
        L.id AS lote_id,
        P.nombre AS producto,
        L.numero_lote,
        L.fecha_vencimiento,
        L.stock,
        DATEDIFF(DAY, GETDATE(), L.fecha_vencimiento) AS dias_restantes
      FROM Lotes L
      JOIN Productos P ON L.producto_id = P.id
      WHERE L.fecha_vencimiento BETWEEN GETDATE() AND DATEADD(DAY, @dias_alerta, GETDATE())
        AND L.stock > 0
      ORDER BY L.fecha_vencimiento ASC
    `, { dias_alerta });

    res.json(resultado.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Productos con lotes vencidos
exports.getLotesVencidos = async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT 
        L.id AS lote_id,
        P.nombre AS producto,
        L.numero_lote,
        L.fecha_vencimiento,
        L.stock,
        DATEDIFF(DAY, L.fecha_vencimiento, GETDATE()) AS dias_vencido
      FROM Lotes L
      JOIN Productos P ON L.producto_id = P.id
      WHERE L.fecha_vencimiento < GETDATE()
        AND L.stock > 0
      ORDER BY L.fecha_vencimiento ASC
    `);

    res.json(resultado.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Recomendaciones:Puedes dejar el valor de dias_alerta configurable desde el frontend (por defecto 30).
//Estas alertas pueden mostrarse automáticamente en el dashboard del sistema.