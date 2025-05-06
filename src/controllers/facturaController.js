// src/controllers/facturaController.js

const { Op } = require('sequelize');
const Factura = require('../models/Factura');
const DetalleFactura = require('../models/DetalleFactura');
const Producto = require('../models/Producto');
const Lote = require('../models/Lote');
const Cliente = require('../models/Cliente');

const facturaController = {
  // Crear factura con lógica de inventario y lotes
  async crearFactura(req, res) {
    const t = await Factura.sequelize.transaction(); // Transacción
    try {
      const { cliente_id, productos, medio_pago } = req.body;

      if (!productos || productos.length === 0) {
        return res.status(400).json({ mensaje: 'Debe incluir productos en la factura.' });
      }

      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
      }

      const nuevaFactura = await Factura.create({
        cliente_id,
        fecha_emision: new Date(),
        medio_pago,
        total: 0
      }, { transaction: t });

      let totalFactura = 0;

      for (const item of productos) {
        const { producto_id, cantidad } = item;

        const producto = await Producto.findByPk(producto_id);
        if (!producto) continue;

        const lotes = await Lote.findAll({
          where: {
            producto_id,
            cantidad_disponible: { [Op.gt]: 0 }
          },
          order: [['fecha_caducidad', 'ASC']],
          transaction: t
        });

        let cantidadRestante = cantidad;

        for (const lote of lotes) {
          if (cantidadRestante <= 0) break;

          const usarCantidad = Math.min(cantidadRestante, lote.cantidad_disponible);
          const precio_unitario = producto.costo_venta;

          if (!precio_unitario || precio_unitario <= 0) {
            await t.rollback();
            return res.status(400).json({ mensaje: `El precio del producto ID ${producto_id} es inválido.` });
          }

          await DetalleFactura.create({
            factura_id: nuevaFactura.id,
            producto_id,
            lote_id: lote.id,
            cantidad: usarCantidad,
            precio_unitario
          }, { transaction: t });

          await lote.update({
            cantidad_disponible: lote.cantidad_disponible - usarCantidad
          }, { transaction: t });

          totalFactura += usarCantidad * precio_unitario;
          cantidadRestante -= usarCantidad;
        }

        if (cantidadRestante > 0) {
          console.warn(`No se pudo cubrir toda la cantidad del producto ID ${producto_id}`);
        }
      }

      await nuevaFactura.update({ total: totalFactura }, { transaction: t });

      await t.commit();
      res.status(201).json({ mensaje: 'Factura creada exitosamente.', factura: nuevaFactura });

    } catch (error) {
      await t.rollback();
      console.error('Error al crear factura:', error);
      res.status(500).json({ mensaje: 'Error al crear la factura.' });
    }
  },

  // Listar todas las facturas
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

  // Obtener factura por ID con detalle
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
        include: [
          { model: Producto, attributes: ['nombre'] },
          { model: Lote, attributes: ['numero_lote', 'fecha_caducidad'] }
        ]
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
