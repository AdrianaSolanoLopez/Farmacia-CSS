export const validarRegistroCambio = (req, res, next) => {
  const { usuario, modulo_afectado, descripcion_cambio } = req.body;

  // Validar campos requeridos
  if (!usuario?.trim() || !modulo_afectado?.trim() || !descripcion_cambio?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios',
      requiredFields: ['usuario', 'modulo_afectado', 'descripcion_cambio']
    });
  }

  // Validar longitudes máximas
  const errores = [];

  if (usuario.length > 100) {
    errores.push('Usuario no puede exceder 100 caracteres');
  }

  if (modulo_afectado.length > 50) {
    errores.push('Módulo afectado no puede exceder 50 caracteres');
  }

  if (descripcion_cambio.length > 500) {
    errores.push('Descripción no puede exceder 500 caracteres');
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