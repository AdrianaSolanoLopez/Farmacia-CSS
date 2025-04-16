//15. Modelo: HistorialCambio
//Permite auditar cualquier cambio importante en los productos, lotes, precios, ajustes de inventario, etc.

// models/HistorialCambio.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const HistorialCambio = sequelize.define('HistorialCambio', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  entidad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  registroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'HistorialCambios',
  timestamps: true,
});

HistorialCambio.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = HistorialCambio;
