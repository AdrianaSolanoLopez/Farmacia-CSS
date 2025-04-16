//4. Modelo: Producto

// models/Producto.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UnidadMedida = require('./UnidadMedida');
const Temperatura = require('./Temperatura');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  costoCompra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  costoVenta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stockMinimo: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stockTotal: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Productos',
  timestamps: true
});

// Relaciones con otras tablas
Producto.belongsTo(UnidadMedida, { foreignKey: 'unidadMedidaId' });
Producto.belongsTo(Temperatura, { foreignKey: 'temperaturaId' });

module.exports = Producto;
