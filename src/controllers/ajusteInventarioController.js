// src/controllers/ajusteInventarioController.js
import pool from '../config/db.js';

export const obtenerAjustes = async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM AjustesInventario');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener ajustes:', error);
    res.status(500).json({ message: 'Error al obtener los ajustes de inventario' });
  }
};

export const registrarAjuste = async (req, res) => {
  try {
    const { productoId, cantidad, motivo } = req.body;
    const query = `
      INSERT INTO AjustesInventario (productoId, cantidad, motivo, fecha)
      VALUES (@productoId, @cantidad, @motivo, GETDATE());
    `;
    const request = pool.request();
    request.input('productoId', productoId);
    request.input('cantidad', cantidad);
    request.input('motivo', motivo);
    await request.query(query);

    res.status(201).json({ message: 'Ajuste de inventario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar ajuste:', error);
    res.status(500).json({ message: 'Error al registrar el ajuste de inventario' });
  }
};
