export const validarFactura = (req, res, next) => {
  const { cliente_id, productos, medio_pago } = req.body;

  // Validar campos requeridos
  if (!cliente_id || !productos || !medio_pago) {
    return res.status(400).json({
      success: false,
      message: 'Campos obligatorios faltantes',
      requiredFields: ['cliente_id', 'productos', 'medio_pago']
    });
  }

  // Validar estructura de productos
  if (!Array.isArray(productos)) {
    return res.status(400).json({
      success: false,
      message: 'Los productos deben ser un array'
    });
  }

  // Validar cada producto
  for (const [index, producto] of productos.entries()) {
    if (!producto.producto_id || !producto.cantidad) {
      return res.status(400).json({
        success: false,
        message: `Producto en posición ${index} no tiene los campos requeridos`,
        requiredFields: ['producto_id', 'cantidad']
      });
    }

    if (producto.cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: `La cantidad del producto en posición ${index} debe ser mayor a 0`
      });
    }
  }

  next();
};