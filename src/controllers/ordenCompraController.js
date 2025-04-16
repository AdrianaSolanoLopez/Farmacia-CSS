//ordenCompraController.js

// controllers/ordenCompraController.js

const db = require('../config/db');

const crearOrdenCompra = async (req, res) => {
  try {
    const { proveedor_id, productos, usuario_id } = req.body;

    const fecha = new Date();

    const result = await db.query(
      'INSERT INTO OrdenesCompra (proveedor_id, fecha, usuario_id) OUTPUT INSERTED.id VALUES (@proveedor_id, @fecha, @usuario_id)',
      {
        proveedor_id,
        fecha,
        usuario_id
      }
    );

    const orden_id = result.recordset[0].id;

    for (const producto of productos) {
      await db.query(
        'INSERT INTO DetallesOrdenCompra (orden_id, producto_id, cantidad, costo_unitario) VALUES (@orden_id, @producto_id, @cantidad, @costo_unitario)',
        {
          orden_id,
          producto_id: producto.id,
          cantidad: producto.cantidad,
          costo_unitario: producto.costo_unitario
        }
      );

      // Puedes actualizar inventario aquí si lo deseas automáticamente
    }

    res.status(201).json({ mensaje: 'Orden de compra registrada con éxito', orden_id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar la orden de compra' });
  }
};

const obtenerOrdenesCompra = async (req, res) => {
  try {
    const ordenes = await db.query('SELECT * FROM OrdenesCompra');
    res.json(ordenes.recordset);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener las órdenes de compra' });
  }
};

const obtenerOrdenPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const orden = await db.query(
      'SELECT * FROM OrdenesCompra WHERE id = @id',
      { id }
    );

    const detalles = await db.query(
      'SELECT * FROM DetallesOrdenCompra WHERE orden_id = @id',
      { id }
    );

    res.json({ orden: orden.recordset[0], detalles: detalles.recordset });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la orden' });
  }
};

module.exports = {
  crearOrdenCompra,
  obtenerOrdenesCompra,
  obtenerOrdenPorId
};
