// src/controllers/alertasController.js
import pool from '../config/db.js';

export const obtenerAlertas = async (req, res) => {
  try {
    const query = `
      SELECT 
        L.id AS loteId,
        P.nombre AS producto,
        L.fechaVencimiento,
        L.cantidad
      FROM Lotes L
      JOIN Productos P ON L.productoId = P.id
      WHERE L.fechaVencimiento <= DATEADD(MONTH, 6, GETDATE())
        AND L.cantidad > 0
      ORDER BY L.fechaVencimiento ASC;
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener alertas de productos por vencer:', error);
    res.status(500).json({ error: 'Error interno al obtener alertas de inventario.' });
  }
};


