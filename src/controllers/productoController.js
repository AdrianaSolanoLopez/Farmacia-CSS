import { executeQuery, sql, getPool } from '../config/db.js';
import moment from 'moment';

export const createProduct = async (req, res) => {
  const {
    codigo_barras,
    nombre_producto,
    concentracion,
    forma_farmaceutica,
    presentacion,
    laboratorio,
    registro_sanitario,
    temperatura_id,
    proveedor_id,
    categoria
  } = req.body;

  // Validaciones mínimas
  if (!nombre_producto || !presentacion) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos',
      requiredFields: ['nombre_producto', 'presentacion']
    });
  }

   try {
    const result = await executeQuery(
      `INSERT INTO Productos 
       (codigo_barras, nombre_producto, concentracion, forma_farmaceutica, presentacion, laboratorio, registro_sanitario, temperatura_id, proveedor_id, categoria, estado)
       OUTPUT INSERTED.producto_id
       VALUES (@codigo_barras, @nombre_producto, @concentracion, @forma_farmaceutica, @presentacion, @laboratorio, @registro_sanitario, @temperatura_id, @proveedor_id, @categoria, 1)`,
      [
        { name: 'codigo_barras', value: codigo_barras || null, type: sql.NVarChar(50) },
        { name: 'nombre_producto', value: nombre_producto, type: sql.NVarChar(50) },
        { name: 'concentracion', value: concentracion || null, type: sql.NVarChar(50) },
        { name: 'forma_farmaceutica', value: forma_farmaceutica || null, type: sql.NVarChar(50) },
        { name: 'presentacion', value: presentacion, type: sql.NVarChar(50) },
        { name: 'laboratorio', value: laboratorio || null, type: sql.NVarChar(50) },
        { name: 'registro_sanitario', value: registro_sanitario || null, type: sql.NVarChar(50) },
        { name: 'temperatura_id', value: temperatura_id || null, type: sql.Int },
        { name: 'proveedor_id', value: proveedor_id || null, type: sql.Int },
        { name: 'categoria', value: categoria || null, type: sql.NVarChar(50) }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: {
        producto_id: result.recordset[0].producto_id,
        nombre_producto
      }
    });
  } catch (error) {
    console.error('Error en createProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
//-----------------
export const getAllProducts = async (req, res) => {
  try {
    const { categoria_id, proveedor_id, con_stock } = req.query;

    const whereConditions = ['p.estado = 1'];
const params = [];

if (categoria_id) {
  whereConditions.push('p.categoria_id = @categoria_id');
  params.push({ name: 'categoria_id', value: categoria_id, type: sql.Int });
}
if (proveedor_id) {
  whereConditions.push('p.proveedor_id = @proveedor_id');
  params.push({ name: 'proveedor_id', value: proveedor_id, type: sql.Int });
}
if (con_stock === 'true') {
  whereConditions.push(`EXISTS (
    SELECT 1 FROM Lotes l 
    WHERE l.producto_id = p.producto_id 
    AND l.cantidad_disponible > 0
  )`);
}

const whereSQL = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

const result = await executeQuery(`
  SELECT 
    p.producto_id,
    p.codigo_barras,
    p.nombre_producto,
    p.concentracion,
    p.forma_farmaceutica,
    p.presentacion,
    p.laboratorio,
    p.registro_sanitario,
    pr.nombre_proveedor AS proveedor,
    (SELECT SUM(l.cantidad_disponible) FROM Lotes l WHERE l.producto_id = p.producto_id) AS stock_actual,
    CASE 
      WHEN (SELECT SUM(l.cantidad_disponible) FROM Lotes l WHERE l.producto_id = p.producto_id) <= 10 THEN 'CRITICO'
      WHEN (SELECT SUM(l.cantidad_disponible) FROM Lotes l WHERE l.producto_id = p.producto_id) <= 20 THEN 'ALERTA'
      ELSE 'NORMAL'
    END AS estado_stock
  FROM Productos p
  LEFT JOIN Proveedores pr ON p.proveedor_id = pr.proveedor_id
  ${whereSQL}
  ORDER BY p.nombre_producto
`, params);
    
    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        filters: {
          categoria_id,
          proveedor_id,
          con_stock
        }
      }
    });
  } catch (error) {
    console.error('Error en getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
};
//---------------------------------------------------
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await executeQuery(`
      SELECT 
        p.*,
        pr.nombre AS proveedor,
        p.categoria AS categoria,

        (SELECT SUM(l.cantidad_disponible) FROM Lotes l WHERE p.producto_id = @id) AS stock_actual
      FROM Productos p
      LEFT JOIN Proveedores pr ON p.proveedor_id = pr.id
      LEFT JOIN Categorias c ON p.categoria_id = c.id
      WHERE p.producto_id = @id
    `, [{ name: 'id', value: id, type: sql.Int }]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    codigo_barras,
    unidad_medida,
    precio_compra,
    precio_venta,
    stock_minimo,
    proveedor_id,
    categoria_id
  } = req.body;

  try {
    // Verificar que el producto existe
    const producto = await executeQuery(
      'SELECT id FROM Productos WHERE id = @id',
      [{ name: 'id', value: id, type: sql.Int }]
    );

    if (producto.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Actualizar producto
    await executeQuery(
      `UPDATE Productos SET
        nombre = @nombre,
        descripcion = @descripcion,
        codigo_barras = @codigo_barras,
        unidad_medida = @unidad_medida,
        precio_compra = @precio_compra,
        precio_venta = @precio_venta,
        stock_minimo = @stock_minimo,
        proveedor_id = @proveedor_id,
        categoria_id = @categoria_id
       WHERE id = @id`,
      [
        { name: 'nombre', value: nombre, type: sql.NVarChar(100) },
        { name: 'descripcion', value: descripcion || null, type: sql.NVarChar(500) },
        { name: 'codigo_barras', value: codigo_barras || null, type: sql.NVarChar(50) },
        { name: 'unidad_medida', value: unidad_medida, type: sql.NVarChar(20) },
        { name: 'precio_compra', value: precio_compra || 0, type: sql.Decimal(10, 2) },
        { name: 'precio_venta', value: precio_venta, type: sql.Decimal(10, 2) },
        { name: 'stock_minimo', value: stock_minimo || 0, type: sql.Int },
        { name: 'proveedor_id', value: proveedor_id || null, type: sql.Int },
        { name: 'categoria_id', value: categoria_id || null, type: sql.Int },
        { name: 'id', value: id, type: sql.Int }
      ]
    );

    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: { id }
    });
  } catch (error) {
    console.error('Error en updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el producto tiene stock
    const stock = await executeQuery(
      `SELECT SUM(cantidad_disponible) AS stock 
       FROM Lotes 
       WHERE producto_id = @id
       GROUP BY producto_id`,
      [{ name: 'id', value: id, type: sql.Int }]
    );

    const stockActual = stock.recordset[0]?.stock || 0;
    if (stockActual > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un producto con stock disponible',
        stock_actual: stockActual
      });
    }

    // Desactivar producto (eliminación lógica)
    const result = await executeQuery(
      'UPDATE Productos SET estado = 0 WHERE id = @id',
      [{ name: 'id', value: id, type: sql.Int }]
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto desactivado correctamente',
      data: { id }
    });
  } catch (error) {
    console.error('Error en deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar producto'
    });
  }
};

import { v4 as uuidv4 } from 'uuid';
export const createLote = async (req, res) => {
  const { producto_id } = req.params;
  const { fecha_vencimiento, cantidad, precio_compra, observaciones } = req.body;

  // Validaciones
  if (!numero_lote || !fecha_vencimiento || !cantidad || cantidad <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos o inválidos',
      requiredFields: ['fecha_vencimiento', 'cantidad', 'precio_compra']
    });
  }

  try {
    // Verificar que el producto existe
    const producto = await executeQuery(
      'SELECT producto_id FROM Productos WHERE producto_id = @producto_id AND estado = 1',
      [{ name: 'producto_id', value: producto_id, type: sql.Int }]
    );

    if (producto.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o inactivo'
      });
    }

    // Insertar lote
    const lote_id = uuidv4();
    
   const result = await executeQuery(
      `INSERT INTO Lotes 
       (lote_id, producto_id, fecha_vencimiento, cantidad_disponible, precio_compra, observaciones)
       OUTPUT INSERTED.lote_id
       VALUES (@lote_id, @producto_id, @fecha_vencimiento, @cantidad, @precio_compra, @observaciones)`,
      [
        { name: 'lote_id', value: lote_id, type: sql.NVarChar(50) },
        { name: 'producto_id', value: producto_id, type: sql.Int },
        //{ name: 'numero_lote', value: numero_lote, type: sql.NVarChar(50) },
        { name: 'fecha_vencimiento', value: new Date(fecha_vencimiento), type: sql.Date },
        { name: 'cantidad', value: cantidad, type: sql.Decimal(10, 2) },
        { name: 'precio_compra', value: precio_compra, type: sql.Decimal(10, 2) },
        { name: 'observaciones', value: observaciones || null, type: sql.NVarChar(sql.MAX) }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Lote creado correctamente',
      data: {
        lote_id: result.recordset[0].lote_id,
        producto_id,
        //numero_lote
      }
    });
  } catch (error) {
    console.error('Error en createLote:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear lote',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
//________________________________________
export const getLotesByProductId = async (req, res) => {
  const { producto_id } = req.params;

  try {
    const result = await executeQuery(`
      SELECT 
        lote_id,
        numero_lote,
        FORMAT(fecha_vencimiento, 'yyyy-MM-dd') AS fecha_vencimiento,
        cantidad_disponible,
        DATEDIFF(DAY, GETDATE(), fecha_vencimiento) AS dias_restantes,
        CASE 
          WHEN fecha_vencimiento <= DATEADD(DAY, 30, GETDATE()) THEN 'PRONTO_A_VENCER'
          ELSE 'VIGENTE'
        END AS estado_lote
      FROM Lotes
      WHERE producto_id = @producto_id
        AND cantidad_disponible > 0
      ORDER BY fecha_vencimiento ASC
    `, [{ name: 'producto_id', value: producto_id, type: sql.Int }]);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        producto_id,
        total_lotes: result.recordset.length,
        stock_total: result.recordset.reduce((sum, lote) => sum + lote.cantidad_disponible, 0)
      }
    });
  } catch (error) {
    console.error('Error en getLotesByProductId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes del producto'
    });
  }
};

export const getLotesPorVencer = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const fechaLimite = moment().add(dias, 'days').toDate();

    const result = await executeQuery(`
      SELECT 
        p.id AS producto_id,
        p.nombre AS producto,
        l.id AS lote_id,
        l.numero_lote,
        FORMAT(l.fecha_vencimiento, 'yyyy-MM-dd') AS fecha_vencimiento,
        l.cantidad_disponible,
        DATEDIFF(DAY, GETDATE(), l.fecha_vencimiento) AS dias_restantes
      FROM Lotes l
      JOIN Productos p ON l.producto_id = p.id
      WHERE l.fecha_vencimiento BETWEEN GETDATE() AND @fechaLimite
        AND l.cantidad_disponible > 0
      ORDER BY l.fecha_vencimiento ASC
    `, [{ name: 'fechaLimite', value: fechaLimite, type: sql.Date }]);

    res.json({
      success: true,
      data: result.recordset,
      meta: {
        total: result.recordset.length,
        dias_analizados: dias,
        fecha_limite: fechaLimite
      }
    });
  } catch (error) {
    console.error('Error en getLotesPorVencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes próximos a vencer'
    });
  }
};