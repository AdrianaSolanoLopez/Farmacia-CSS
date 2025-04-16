//1. Controlador: Productos y Lotes------------
//Lógica básica para:Crear un producto, Obtener todos los productos
//Obtener un producto por ID, Actualizar un producto, Eliminar (desactivar) un producto
//Crear un lote para un producto, Obtener todos los lotes de un producto
//Verificar productos con lotes próximos a vencer.

// productoControler

const db = require('../db'); // o tu conexión pool a SQL Server
const moment = require('moment');

// Crear un producto
exports.createProduct = async (req, res) => {
  const { nombre, descripcion, unidad_medida, precio_compra, precio_venta, stock_minimo, proveedor_id } = req.body;
  try {
    await db.query(`
      INSERT INTO Productos (nombre, descripcion, unidad_medida, precio_compra, precio_venta, stock_minimo, proveedor_id)
      VALUES (@nombre, @descripcion, @unidad_medida, @precio_compra, @precio_venta, @stock_minimo, @proveedor_id)
    `, {
      nombre, descripcion, unidad_medida, precio_compra, precio_venta, stock_minimo, proveedor_id
    });

    res.status(201).json({ message: 'Producto creado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Productos WHERE estado = 1');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un producto por ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM Productos WHERE id = @id', { id });
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un producto
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, unidad_medida, precio_compra, precio_venta, stock_minimo, proveedor_id } = req.body;

  try {
    await db.query(`
      UPDATE Productos
      SET nombre = @nombre, descripcion = @descripcion, unidad_medida = @unidad_medida,
          precio_compra = @precio_compra, precio_venta = @precio_venta, stock_minimo = @stock_minimo,
          proveedor_id = @proveedor_id
      WHERE id = @id
    `, {
      id, nombre, descripcion, unidad_medida, precio_compra, precio_venta, stock_minimo, proveedor_id
    });

    res.json({ message: 'Producto actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar (desactivar) un producto
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE Productos SET estado = 0 WHERE id = @id', { id });
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear lote para producto
exports.createLote = async (req, res) => {
  const { producto_id, numero_lote, fecha_vencimiento, cantidad } = req.body;
  try {
    await db.query(`
      INSERT INTO Lotes (producto_id, numero_lote, fecha_vencimiento, cantidad_disponible)
      VALUES (@producto_id, @numero_lote, @fecha_vencimiento, @cantidad)
    `, {
      producto_id,
      numero_lote,
      fecha_vencimiento: moment(fecha_vencimiento).format('YYYY-MM-DD'),
      cantidad
    });

    res.status(201).json({ message: 'Lote creado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los lotes de un producto
exports.getLotesByProductId = async (req, res) => {
  const { producto_id } = req.params;
  try {
    const result = await db.query(`
      SELECT * FROM Lotes WHERE producto_id = @producto_id AND cantidad_disponible > 0
    `, { producto_id });

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener productos con lotes próximos a vencer
exports.getLotesPorVencer = async (req, res) => {
  try {
    const hoy = moment().format('YYYY-MM-DD');
    const en30Dias = moment().add(30, 'days').format('YYYY-MM-DD');

    const result = await db.query(`
      SELECT p.nombre AS producto, l.numero_lote, l.fecha_vencimiento, l.cantidad_disponible
      FROM Lotes l
      JOIN Productos p ON l.producto_id = p.id
      WHERE l.fecha_vencimiento BETWEEN @hoy AND @en30Dias AND l.cantidad_disponible > 0
    `, { hoy, en30Dias });

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
