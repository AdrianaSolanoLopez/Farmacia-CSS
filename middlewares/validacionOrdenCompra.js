export const validarOrdenCompra = (req, res, next) => {
  const { proveedor_id, fecha, productos, usuario_id } = req.body;

  // Validar campos requeridos
  const camposRequeridos = ['proveedor_id', 'fecha', 'productos', 'usuario_id'];
  const faltantes = camposRequeridos.filter(campo => !req.body[campo]);

  if (faltantes.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Campos obligatorios faltantes',
      camposFaltantes: faltantes
    });
  }

  // Validar productos
  if (!Array.isArray(productos)) {
    return res.status(400).json({
      success: false,
      message: 'Los productos deben ser un array'
    });
  }

  if (productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Debe incluir al menos un producto'
    });
  }

  const productosInvalidos = productos.filter(p =>
    !p.producto_id || !p.cantidad || !p.costo_unitario ||
    p.cantidad <= 0 || p.costo_unitario <= 0
  );

  if (productosInvalidos.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Algunos productos tienen datos inválidos',
      productosInvalidos
    });
  }

  next();
};