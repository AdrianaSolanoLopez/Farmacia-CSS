//6. Controlador: Facturación
//Este flujo se encarga de registrar una venta, calcular totales, aplicar descuentos (si los hay), enlazar con cliente y lotes de productos, y finalmente generar la factura.
//Crear una factura con su detalle de productos, Obtener facturas por cliente o por fecha
//Consultar una factura individual, Anular o eliminar una factura (si aplica).

const { Op } = require('sequelize');
const Factura = require('../models/Factura');
const DetalleFactura = require('../models/DetalleFactura');
const Producto = require('../models/Producto');
const Lote = require('../models/Lote');
const Cliente = require('../models/Cliente');

const facturaController = {
  // Crear factura con lógica de inventario y lotes
  async crearFactura(req, res) {
    try {
      const { cliente_id, productos, medio_pago } = req.body;

      // Validar productos
      if (!productos || productos.length === 0) {
        return res.status(400).json({ mensaje: 'Debe incluir productos en la factura.' });
      }

      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
      }

      // Crear factura (encabezado)
      const nuevaFactura = await Factura.create({
        cliente_id,
        fecha_emision: new Date(),
        medio_pago,
        total: 0 // lo calculamos abajo
      });

      let totalFactura = 0;

      // Procesar cada producto
      for (const item of productos) {
        const { producto_id, cantidad } = item;

        const producto = await Producto.findByPk(producto_id);
        if (!producto) {
          console.warn(`Producto ID ${producto_id} no encontrado.`);
          continue; // Si el producto no existe, saltamos al siguiente
        }

        // Verificar stock disponible en lotes
        const lotes = await Lote.findAll({
          where: {
            producto_id,
            cantidad_disponible: { [Op.gt]: 0 }
          },
          order: [['fecha_caducidad', 'ASC']]
        });

        let cantidadRestante = cantidad;

        for (const lote of lotes) {
          if (cantidadRestante <= 0) break;

          const cantidadDisponible = lote.cantidad_disponible;
          const usarCantidad = Math.min(cantidadRestante, cantidadDisponible);
          const precio_unitario = producto.costo_venta;

          // Validar que el precio sea válido
          if (!precio_unitario || precio_unitario <= 0) {
            console.warn(`Producto ID ${producto_id} tiene un precio inválido.`);
            return res.status(400).json({ mensaje: 'El precio del producto es inválido.' });
          }

          // Registrar detalle de factura
          await DetalleFactura.create({
            factura_id: nuevaFactura.id,
            producto_id,
            lote_id: lote.id,
            cantidad: usarCantidad,
            precio_unitario
          });

          // Actualizar stock del lote
          await lote.update({
            cantidad_disponible: lote.cantidad_disponible - usarCantidad
          });

          // Calcular total
          totalFactura += usarCantidad * precio_unitario;
          cantidadRestante -= usarCantidad;
        }

        if (cantidadRestante > 0) {
          console.warn(`No se pudo satisfacer toda la cantidad solicitada del producto ID ${producto_id}`);
        }
      }

      // Actualizar total de la factura
      await nuevaFactura.update({ total: totalFactura });

      res.status(201).json({ mensaje: 'Factura creada exitosamente.', factura: nuevaFactura });
    } catch (error) {
      console.error('Error al crear factura:', error);
      res.status(500).json({ mensaje: 'Error al crear la factura.' });
    }
  },

  // Obtener todas las facturas
  async listarFacturas(req, res) {
    try {
      const facturas = await Factura.findAll({
        include: [{ model: Cliente, attributes: ['nombre'] }],
        order: [['fecha_emision', 'DESC']]
      });

      res.json(facturas);
    } catch (error) {
      console.error('Error al listar facturas:', error);
      res.status(500).json({ mensaje: 'Error al listar facturas.' });
    }
  },

  // Obtener una factura por ID con detalle
  async obtenerFacturaPorId(req, res) {
    try {
      const { id } = req.params;

      const factura = await Factura.findByPk(id, {
        include: [{ model: Cliente, attributes: ['nombre'] }]
      });

      if (!factura) {
        return res.status(404).json({ mensaje: 'Factura no encontrada.' });
      }

      const detalle = await DetalleFactura.findAll({
        where: { factura_id: id },
        include: [{ model: Producto, attributes: ['nombre'] }]
      });

      res.json({
        ...factura.toJSON(),
        detalle
      });
    } catch (error) {
      console.error('Error al obtener factura:', error);
      res.status(500).json({ mensaje: 'Error al obtener la factura.' });
    }
  }
};

module.exports = facturaController;

