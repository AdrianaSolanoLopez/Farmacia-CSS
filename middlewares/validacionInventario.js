export const validarAjusteInventario = (req, res, next) => {
  const { lote_id, tipo_ajuste, cantidad, motivo, usuario } = req.body;

  // Validar campos requeridos
  const camposRequeridos = ['lote_id', 'tipo_ajuste', 'cantidad', 'motivo', 'usuario'];
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

  if (!['entrada', 'salida'].includes(tipo_ajuste)) {
    errores.push('Tipo de ajuste debe ser "entrada" o "salida"');
  }

  if (motivo.length > 255) {
    errores.push('El motivo no puede exceder 255 caracteres');
  }

  if (usuario.length > 100) {
    errores.push('El nombre de usuario no puede exceder 100 caracteres');
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