//11. Modelo: DetalleDevolucion
//Relaciona cada devolución con los productos y lotes devueltos, incluyendo cantidades.

// models/DetalleDevolucion.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Devolucion = require('./devolucionModel');
const Lote = require('./Lote');

const DetalleDevolucion = sequelize.define('DetalleDevolucion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'DetalleDevoluciones',
  timestamps: true,
});

DetalleDevolucion.belongsTo(Devolucion, { foreignKey: 'devolucionId' });
DetalleDevolucion.belongsTo(Lote, { foreignKey: 'loteId' });

module.exports = DetalleDevolucion;
