//6. Modelo: Lote
//Este modelo es clave porque maneja la trazabilidad de cada producto con su número de lote y fecha de vencimiento.

// models/Lote.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Producto = require('./Producto');
const Proveedor = require('./Proveedor');

const Lote = sequelize.define('Lote', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  numeroLote: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fechaVencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'Lotes',
  timestamps: true,
});

Lote.belongsTo(Producto, { foreignKey: 'productoId' });
Lote.belongsTo(Proveedor, { foreignKey: 'proveedorId' });

module.exports = Lote;


