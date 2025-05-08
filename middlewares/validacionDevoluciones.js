// validacionDevoluciones.js
export const validarDevolucion = (req, res, next) => {
  const { venta_id, producto_id, lote_id, cantidad } = req.body;

  if (!venta_id || !producto_id || !lote_id || !cantidad) {
    return res.status(400).json({
      success: false,
      message: 'Campos obligatorios faltantes'
    });
  }

  if (!Number.isInteger(parseInt(cantidad)) || cantidad <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Cantidad debe ser un entero positivo'
    });
  }

  next();
};