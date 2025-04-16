//9. Modelo: DetalleVenta
//Relación entre ventas y los productos/lotes vendidos, cantidades, precios, etc.

// models/DetalleVenta.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Venta = require('./Venta');
const Lote = require('./Lote');

const DetalleVenta = sequelize.define('DetalleVenta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  }
}, {
  tableName: 'DetalleVentas',
  timestamps: true,
});

DetalleVenta.belongsTo(Venta, { foreignKey: 'ventaId' });
DetalleVenta.belongsTo(Lote, { foreignKey: 'loteId' });

module.exports = DetalleVenta;

