//2. Modelo: UnidadMedida

// models/UnidadMedida.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UnidadMedida = sequelize.define('UnidadMedida', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  abreviatura: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'UnidadesMedida',
  timestamps: false,
});

module.exports = UnidadMedida;
