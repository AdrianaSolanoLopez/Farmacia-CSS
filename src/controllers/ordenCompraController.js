//ordenCompraController.js

// controllers/ordenCompraController.js

const db = require('../config/db.js');

const ordenesCompraController = {
  // Registrar Orden de Compra
  registrarOrdenCompra: async (req, res) => {
    const { proveedor_id, fecha, productos, usuario_id } = req.body;

    // Validaciones básicas
    if (!proveedor_id || !fecha || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Datos incompletos o inválidos' });
    }

    try {
      // Insertar la orden de compra
      const result = await db.query(
        `INSERT INTO OrdenesCompra (proveedor_id, fecha, usuario_id) 
         OUTPUT INSERTED.id 
         VALUES (@proveedor_id, @fecha, @usuario_id)`,
        { proveedor_id, fecha, usuario_id }
      );
      const ordenId = result.recordset[0].id;

      // Insertar los detalles de la orden
      for (const producto of productos) {
        const { producto_id, cantidad, costo_unitario } = producto;

        // Validar datos del producto
        if (!producto_id || !cantidad || !costo_unitario) {
          return res.status(400).json({ mensaje: 'Producto con datos incompletos' });
        }

        // Insertar detalles de la orden de compra
        await db.query(
          `INSERT INTO DetallesOrdenCompra (orden_id, producto_id, cantidad, costo_unitario) 
           VALUES (@orden_id, @producto_id, @cantidad, @costo_unitario)`,
          { orden_id: ordenId, producto_id, cantidad, costo_unitario }
        );
      }

      res.status(201).json({
        mensaje: 'Orden de compra registrada con éxito',
        ordenId
      });

    } catch (error) {
      console.error('Error al registrar orden de compra:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  // Obtener todas las órdenes de compra
  obtenerOrdenesCompra: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT * FROM OrdenesCompra ORDER BY fecha DESC`
      );

      res.json(result.recordset);
    } catch (error) {
      console.error('Error al obtener ordenes de compra:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  },

  // Obtener detalles de una orden por ID
  obtenerOrdenPorId: async (req, res) => {
    const { id } = req.params;

    try {
      const orden = await db.query(
        `SELECT * FROM OrdenesCompra WHERE id = @id`,
        { id }
      );

      const detalles = await db.query(
        `SELECT * FROM DetallesOrdenCompra WHERE orden_id = @id`,
        { id }
      );

      res.json({ orden: orden.recordset[0], detalles: detalles.recordset });
    } catch (error) {
      console.error('Error al obtener la orden:', error);
      res.status(500).json({ mensaje: 'Error del servidor' });
    }
  }
};

module.exports = ordenesCompraController;

