//13. Modelo: ConfiguracionSistema
//Permite guardar configuraciones como alertas, márgenes de ganancia, nombre del negocio, etc.

// models/ConfiguracionSistema.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracionSistema = sequelize.define('ConfiguracionSistema', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  clave: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  valor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'ConfiguracionesSistema',
  timestamps: true,
});

module.exports = ConfiguracionSistema;
