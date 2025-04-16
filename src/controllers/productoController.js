const Producto = require('../models/productoModel');
const Lote = require('../models/loteModel');

const crearProducto = async (req, res) => {
  try {
    const nuevoProducto = await Producto.create(req.body);
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el producto', detalle: error.message });
  }
};

const listarProductos = async (req, res) => {
  try {
    const productos = await Producto.findAllWithLotes();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar productos', detalle: error.message });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const actualizado = await Producto.update(req.params.id, req.body);
    res.status(200).json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar', detalle: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    await Producto.softDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar', detalle: error.message });
  }
};

const agregarLote = async (req, res) => {
  try {
    const lote = await Lote.create(req.body);
    res.status(201).json(lote);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar lote', detalle: error.message });
  }
};

const listarLotesPorProducto = async (req, res) => {
  try {
    const lotes = await Lote.findByProducto(req.params.producto_id);
    res.status(200).json(lotes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lotes', detalle: error.message });
  }
};

module.exports = {
  crearProducto,
  listarProductos,
  actualizarProducto,
  eliminarProducto,
  agregarLote,
  listarLotesPorProducto
};
