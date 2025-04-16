//8. Controlador: Reportes de Ventas por Fecha
//Este módulo permite consultar las ventas realizadas en un rango de fechas, con el objetivo de generar reportes para toma de decisiones.
//este controlador Obtiene todas las ventas entre dos fechas, Mostrar totales por venta y por día
//Incluir detalles como productos vendidos, cantidades, precios, etc.

const db = require('../db');

// Reporte de ventas por rango de fechas
exports.getVentasPorFecha = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.body;

  try {
    const ventas = await db.query(`
      SELECT V.id AS venta_id, V.fecha_venta, V.total_venta, V.tipo_pago, 
             C.nombre AS cliente, U.nombre AS usuario
      FROM Ventas V
      LEFT JOIN Clientes C ON V.cliente_id = C.id
      JOIN Usuarios U ON V.usuario_id = U.id
      WHERE V.fecha_venta BETWEEN @fecha_inicio AND @fecha_fin
      ORDER BY V.fecha_venta DESC
    `, { fecha_inicio, fecha_fin });

    res.json(ventas.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Detalle de productos vendidos en una venta
exports.getDetalleVenta = async (req, res) => {
  const { venta_id } = req.params;

  try {
    const detalles = await db.query(`
      SELECT DV.producto_id, P.nombre, DV.cantidad, DV.precio_unitario, DV.subtotal
      FROM DetallesVenta DV
      JOIN Productos P ON DV.producto_id = P.id
      WHERE DV.venta_id = @venta_id
    `, { venta_id });

    res.json(detalles.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Consideraciones:Ideal para usar en filtros del frontend tipo: “Mostrar ventas del 1 al 10 de abril”.
//Se puede complementar después con totales por producto, top 10 más vendidos, etc.
//tipo_pago se incluye para diferenciar entre efectivo, tarjeta, etc.

