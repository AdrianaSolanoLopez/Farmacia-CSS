// 1. Controlador: Órdenes de Compra y Salida (ordenesController.js)

const db = require('../config/db');

const ordenesController = {
  registrarOrdenCompra: async (req, res) => {
    const { proveedor_id, fecha, productos } = req.body;

    try {
      const orden = await db.query(
        `INSERT INTO OrdenesCompra (proveedor_id, fecha) 
         OUTPUT INSERTED.id 
         VALUES (@proveedor_id, @fecha)`,
        { proveedor_id, fecha }
      );

      const ordenId = orden.recordset[0].id;

      for (const producto of productos) {
        await db.query(
          `INSERT INTO DetalleOrdenCompra (orden_id, producto_id, cantidad, costo_unitario)
           VALUES (@orden_id, @producto_id, @cantidad, @costo_unitario)`,
          {
            orden_id: ordenId,
            producto_id: producto.producto_id,
            cantidad: producto.cantidad,
            costo_unitario: producto.costo_unitario
          }
        );
      }

      res.status(201).json({ mensaje: 'Orden de compra registrada con éxito' });
    } catch (error) {
      console.error('Error al registrar orden de compra:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  obtenerOrdenesCompra: async (req, res) => {
    try {
      const ordenes = await db.query(
        `SELECT * FROM OrdenesCompra ORDER BY fecha DESC`
      );

      res.json(ordenes.recordset);
    } catch (error) {
      console.error('Error al obtener ordenes de compra:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  }
};

module.exports = ordenesController;
