import { getPool, executeQuery, sql } from '../config/db.js';

export const obtenerConfiguracion = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await executeQuery('SELECT * FROM ConfiguracionSistema');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró configuración registrada.'
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en obtenerConfiguracion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  const { clave, valor } = req.body;

  if (!clave || !valor) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere clave y valor para actualizar la configuración.'
    });
  }

  try {
    const result = await executeQuery(
      `UPDATE ConfiguracionSistema SET valor = @valor WHERE clave = @clave`,
      [
        { name: 'clave', value: clave, type: sql.VarChar(50) },
        { name: 'valor', value: valor, type: sql.VarChar(255) }
      ]
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró la configuración para la clave proporcionada.'
      });
    }

    const configActualizada = await executeQuery('SELECT * FROM ConfiguracionSistema');

    res.status(200).json({
      success: true,
      message: 'Configuración actualizada con éxito.',
      data: configActualizada.recordset
    });
  } catch (error) {
    console.error('Error en actualizarConfiguracion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};