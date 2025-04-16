//10. Modelo: Devolucion
//Este modelo manejará las devoluciones de productos realizadas por los clientes.

// models/Devolucion.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./Cliente');

const Devolucion = sequelize.define('Devolucion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Devoluciones',
  timestamps: true,
});

Devolucion.belongsTo(Cliente, { foreignKey: 'clienteId' });

module.exports = Devolucion;
