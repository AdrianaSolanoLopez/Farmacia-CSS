//8. Modelo: Venta
//Representa una venta completa, incluyendo fecha, total y el cliente relacionado.

// models/Venta.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./Cliente');

const Venta = sequelize.define('Venta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  medioPago: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'Ventas',
  timestamps: true,
});

Venta.belongsTo(Cliente, { foreignKey: 'clienteId' });

module.exports = Venta;
