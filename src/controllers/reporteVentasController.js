//8. Controlador: Reportes de Ventas por Fecha
//Este módulo permite consultar las ventas realizadas en un rango de fechas, con el objetivo de generar reportes para toma de decisiones.
//este controlador Obtiene todas las ventas entre dos fechas, Mostrar totales por venta y por día
//Incluir detalles como productos vendidos, cantidades, precios, etc.

const db = require('../db');

// Reporte de ventas por rango de fechas
exports.getVentasPorFecha = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.body;

  // Validación de fechas
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ mensaje: 'Las fechas de inicio y fin son requeridas' });
  }

  const isValidDate = (date) => !isNaN(Date.parse(date));
  if (!isValidDate(fecha_inicio) || !isValidDate(fecha_fin)) {
    return res.status(400).json({ mensaje: 'Fechas inválidas' });
  }

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

    // Verificar si se encontraron ventas
    if (!ventas.recordset || ventas.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron ventas en el rango de fechas especificado' });
    }

    res.json({
      success: true,
      message: 'Ventas obtenidas exitosamente',
      data: ventas.recordset
    });
  } catch (error) {
    console.error('Error al obtener las ventas:', error);
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
};

// Detalle de productos vendidos en una venta
exports.getDetalleVenta = async (req, res) => {
  const { venta_id } = req.params;

  // Validación de venta_id
  if (!venta_id || isNaN(venta_id)) {
    return res.status(400).json({ mensaje: 'ID de venta inválido' });
  }

  try {
    const detalles = await db.query(`
      SELECT DV.producto_id, P.nombre, DV.cantidad, DV.precio_unitario, DV.subtotal
      FROM DetallesVenta DV
      JOIN Productos P ON DV.producto_id = P.id
      WHERE DV.venta_id = @venta_id
    `, { venta_id });

    // Verificar si se encontraron detalles
    if (!detalles.recordset || detalles.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron detalles para esta venta' });
    }

    res.json({
      success: true,
      message: 'Detalles de venta obtenidos exitosamente',
      data: detalles.recordset
    });
  } catch (error) {
    console.error('Error al obtener los detalles de la venta:', error);
    res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
};


//Consideraciones:Ideal para usar en filtros del frontend tipo: “Mostrar ventas del 1 al 10 de abril”.
//Se puede complementar después con totales por producto, top 10 más vendidos, etc.
//tipo_pago se incluye para diferenciar entre efectivo, tarjeta, etc.

