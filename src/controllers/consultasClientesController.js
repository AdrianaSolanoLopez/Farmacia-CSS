import { sql, executeQuery } from '../config/db.js';

// Versión con exportaciones nombradas (mejor práctica)
export const obtenerClientePorDocumento = async (req, res) => {
  const { documento } = req.params;

  if (!documento) {
    return res.status(400).json({ mensaje: 'Debe proporcionar un documento de identidad.' });
  }

  try {
    const result = await executeQuery(
      'SELECT * FROM Clientes WHERE documento_identidad = @documento',
      [{ name: 'documento', value: documento }]
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al consultar cliente:', error);
    res.status(500).json({
      mensaje: 'Error al buscar cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

export const historialCompras = async (req, res) => {
  const { clienteId } = req.params;

  if (!clienteId || isNaN(clienteId)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido.' });
  }

  try {
    const result = await executeQuery(`
      SELECT 
        f.id AS factura_id, 
        f.fecha, 
        p.nombre AS producto, 
        df.cantidad, 
        df.precio_venta
      FROM Facturas f
      JOIN DetalleFactura df ON f.id = df.factura_id
      JOIN Productos p ON df.producto_id = p.id
      WHERE f.cliente_id = @clienteId
      ORDER BY f.fecha DESC
    `, [{ name: 'clienteId', value: parseInt(clienteId), type: sql.Int }]);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error en historial de compras:', error);
    res.status(500).json({ mensaje: 'Error al obtener historial' });
  }
};

export const historialDevoluciones = async (req, res) => {
  const { clienteId } = req.params;

  if (!clienteId || isNaN(clienteId)) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido.' });
  }

  try {
    const result = await executeQuery(`
      SELECT 
        d.id, 
        d.fecha, 
        p.nombre AS producto, 
        d.cantidad_devuelta, 
        d.motivo
      FROM Devoluciones d
      JOIN Productos p ON d.producto_id = p.id
      WHERE d.cliente_id = @clienteId
      ORDER BY d.fecha DESC
    `, [{ name: 'clienteId', value: parseInt(clienteId), type: sql.Int }]);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error en historial de devoluciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener devoluciones' });
  }
};