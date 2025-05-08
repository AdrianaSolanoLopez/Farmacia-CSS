import { executeQuery } from '../config/db.js';

export const obtenerAlertas = async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        L.id AS loteId,
        P.nombre AS producto,
        FORMAT(L.fechaVencimiento, 'yyyy-MM-dd') AS fechaVencimiento,
        L.cantidad,
        DATEDIFF(DAY, GETDATE(), L.fechaVencimiento) AS diasRestantes,
        CASE 
          WHEN L.fechaVencimiento <= DATEADD(DAY, 30, GETDATE()) THEN 'CRÍTICO'
          WHEN L.fechaVencimiento <= DATEADD(MONTH, 3, GETDATE()) THEN 'ALERTA'
          ELSE 'VIGENTE'
        END AS estado
      FROM Lotes L
      JOIN Productos P ON L.productoId = P.id
      WHERE L.fechaVencimiento <= DATEADD(MONTH, 6, GETDATE())
        AND L.cantidad > 0
      ORDER BY L.fechaVencimiento ASC;
    `);

    res.status(200).json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        fechaConsulta: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en obtenerAlertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerAlertasBajoStock = async (req, res) => {
  try {
    const { nivel = 10 } = req.query; // Nivel mínimo configurable via query param

    const result = await executeQuery(`
      SELECT 
        P.id AS productoId,
        P.nombre AS producto,
        P.stockMinimo,
        SUM(L.cantidad) AS stockActual,
        (SUM(L.cantidad) / P.stockMinimo * 100) AS porcentajeStock
      FROM Productos P
      LEFT JOIN Lotes L ON P.id = L.productoId
      GROUP BY P.id, P.nombre, P.stockMinimo
      HAVING SUM(L.cantidad) < @nivel OR SUM(L.cantidad) IS NULL
    `, [{ name: 'nivel', value: parseInt(nivel), type: sql.Int }]);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en obtenerAlertasBajoStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas de bajo stock'
    });
  }
};