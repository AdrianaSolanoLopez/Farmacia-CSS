//14. Modelo: Factura
//Representa la factura generada por una venta. Aquí se vinculan los datos del cliente, el total, la fecha, y el método de pago.

// models/Factura.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Usuario = require('./Usuario');

const Factura = sequelize.define('Factura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  metodoPago: {
    type: DataTypes.ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro'),
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'Facturas',
  timestamps: true,
});

Factura.belongsTo(Cliente, { foreignKey: 'clienteId' });
Factura.belongsTo(Usuario, { foreignKey: 'usuarioId' }); // Cajero que realiza la venta

module.exports = Factura;
