//AutenticacionController (para gestión de usuarios y autenticación)
//Este controlador se encargaría de autenticar a los usuarios (por ejemplo, mediante JWT).

const db = require('../config/db');

const pagoController = {
  // Registrar pago de una venta
  registrarPago: async (req, res) => {
    const { venta_id, monto_pagado, tipo_pago } = req.body;

    try {
      await db.query('INSERT INTO Pagos (venta_id, monto_pagado, tipo_pago) VALUES (@venta_id, @monto_pagado, @tipo_pago)', 
        { venta_id, monto_pagado, tipo_pago });

      res.status(201).json({ mensaje: 'Pago registrado con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Consultar pagos realizados en una venta
  obtenerPagosVenta: async (req, res) => {
    const { venta_id } = req.params;

    try {
      const pagos = await db.query('SELECT * FROM Pagos WHERE venta_id = @venta_id', { venta_id });
      res.json(pagos.recordset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = pagoController;
