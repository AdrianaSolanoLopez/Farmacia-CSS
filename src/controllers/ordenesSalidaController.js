//2. ordenesSalidaController.js

const db = require('../config/db');

const ordenesSalidaController = {
  registrarOrdenSalida: async (req, res) => {
    const { cliente_id, fecha, productos } = req.body;

    // Validaciones básicas
    if (!cliente_id || !fecha || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Datos incompletos o inválidos' });
    }

    try {
      // Insertar orden de salida
      const orden = await db.query(
        `INSERT INTO OrdenesSalida (cliente_id, fecha) 
         OUTPUT INSERTED.id 
         VALUES (@cliente_id, @fecha)`,
        { cliente_id, fecha }
      );

      const ordenId = orden.recordset[0].id;

      // Insertar detalles de orden
      for (const producto of productos) {
        const { producto_id, cantidad, precio_unitario } = producto;

        if (!producto_id || !cantidad || !precio_unitario) {
          return res.status(400).json({ mensaje: 'Producto con datos incompletos' });
        }

        await db.query(
          `INSERT INTO DetalleOrdenSalida (orden_id, producto_id, cantidad, precio_unitario)
           VALUES (@orden_id, @producto_id, @cantidad, @precio_unitario)`,
          {
            orden_id: ordenId,
            producto_id,
            cantidad,
            precio_unitario
          }
        );
      }

      res.status(201).json({
        mensaje: 'Orden de salida registrada con éxito',
        ordenId
      });

    } catch (error) {
      console.error('Error al registrar orden de salida:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  obtenerOrdenesSalida: async (req, res) => {
    try {
      const ordenes = await db.query(
        `SELECT * FROM OrdenesSalida ORDER BY fecha DESC`
      );

      res.json(ordenes.recordset);
    } catch (error) {
      console.error('Error al obtener órdenes de salida:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  }
};

module.exports = ordenesSalidaController;
