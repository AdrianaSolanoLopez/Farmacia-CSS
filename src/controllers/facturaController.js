import { Op } from 'sequelize';
//import Factura from '../models/Factura.js';
//import DetalleFactura from '../models/DetalleFactura.js';
//import Producto from '../models/Producto.js';
//import Lote from '../models/Lote.js';
//import Cliente from '../models/Cliente.js';

export const crearFactura = async (req, res) => {
  const t = await Factura.sequelize.transaction();

  try {
    const { cliente_id, productos, medio_pago } = req.body;

    // Validaciones básicas
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir productos en la factura',
        requiredFields: ['cliente_id', 'productos', 'medio_pago']
      });
    }

    const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const nuevaFactura = await Factura.create({
      cliente_id,
      fecha_emision: new Date(),
      medio_pago,
      total: 0
    }, { transaction: t });

    let totalFactura = 0;
    const productosNoCompletos = [];

    for (const item of productos) {
      const { producto_id, cantidad } = item;

      if (!producto_id || !cantidad || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Datos de producto inválidos',
          requiredFields: ['producto_id', 'cantidad']
        });
      }

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        productosNoCompletos.push({ producto_id, motivo: 'Producto no encontrado' });
        continue;
      }

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
          return res.status(400).json({
            success: false,
            message: `Precio inválido para el producto ID ${producto_id}`
          });
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
        productosNoCompletos.push({
          producto_id,
          faltante: cantidadRestante,
          motivo: 'Stock insuficiente'
        });
      }
    }

    await nuevaFactura.update({ total: totalFactura }, { transaction: t });
    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: {
        factura: nuevaFactura,
        advertencias: productosNoCompletos.length > 0 ? productosNoCompletos : null
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en crearFactura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear factura',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const listarFacturas = async (req, res) => {
  try {
    const { desde, hasta, cliente_id } = req.query;

    const where = {};
    if (desde && hasta) {
      where.fecha_emision = {
        [Op.between]: [new Date(desde), new Date(hasta)]
      };
    }
    if (cliente_id) {
      where.cliente_id = cliente_id;
    }

    const facturas = await Factura.findAll({
      where,
      include: [{
        model: Cliente,
        attributes: ['id', 'nombre', 'documento']
      }],
      order: [['fecha_emision', 'DESC']]
    });

    res.json({
      success: true,
      data: facturas,
      meta: {
        total: facturas.length,
        filtros: {
          desde,
          hasta,
          cliente_id
        }
      }
    });
  } catch (error) {
    console.error('Error en listarFacturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar facturas'
    });
  }
};

export const obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const factura = await Factura.findByPk(id, {
      include: [{
        model: Cliente,
        attributes: ['id', 'nombre', 'documento', 'direccion']
      }]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    const detalle = await DetalleFactura.findAll({
      where: { factura_id: id },
      include: [
        {
          model: Producto,
          attributes: ['id', 'nombre', 'codigo_barras']
        },
        {
          model: Lote,
          attributes: ['id', 'numero_lote', 'fecha_caducidad']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        ...factura.toJSON(),
        detalle
      }
    });
  } catch (error) {
    console.error('Error en obtenerFacturaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener factura'
    });
  }
};