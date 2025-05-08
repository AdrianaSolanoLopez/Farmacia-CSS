export const validarProducto = (req, res, next) => {
  const {
    nombre,
    unidad_medida,
    precio_venta,
    codigo_barras
  } = req.body;

  // Validar campos requeridos
  const camposRequeridos = ['nombre', 'unidad_medida', 'precio_venta'];
  const faltantes = camposRequeridos.filter(campo => !req.body[campo]);

  if (faltantes.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Campos obligatorios faltantes',
      camposFaltantes: faltantes
    });
  }

  // Validar tipos de datos
  const errores = [];

  if (precio_venta <= 0) {
    errores.push('El precio de venta debe ser mayor que 0');
  }

  if (codigo_barras && codigo_barras.length > 50) {
    errores.push('El código de barras no puede exceder 50 caracteres');
  }

  if (nombre.length > 100) {
    errores.push('El nombre no puede exceder 100 caracteres');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errores
    });
  }

  next();
};

export const validarLote = (req, res, next) => {
  const { numero_lote, fecha_vencimiento, cantidad } = req.body;

  // Validar campos requeridos
  const camposRequeridos = ['numero_lote', 'fecha_vencimiento', 'cantidad'];
  const faltantes = camposRequeridos.filter(campo => !req.body[campo]);

  if (faltantes.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Campos obligatorios faltantes',
      camposFaltantes: faltantes
    });
  }

  // Validar tipos de datos
  const errores = [];

  if (isNaN(cantidad) || cantidad <= 0) {
    errores.push('La cantidad debe ser un número positivo');
  }

  if (numero_lote.length > 50) {
    errores.push('El número de lote no puede exceder 50 caracteres');
  }

  if (new Date(fecha_vencimiento) < new Date()) {
    errores.push('La fecha de vencimiento no puede ser en el pasado');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errores
    });
  }

  next();
};