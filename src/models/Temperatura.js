//3. Modelo: Temperatura

// models/Temperatura.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Temperatura = sequelize.define('Temperatura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rango: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  observacion: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'Temperaturas',
  timestamps: false,
});

module.exports = Temperatura;
