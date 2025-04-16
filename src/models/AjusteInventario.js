//12. Modelo: AjusteInventario
//Para registrar ajustes realizados por diferencias en el stock, ya sea por pérdida, vencimiento, conteos, etc.

// models/AjusteInventario.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Lote = require('./Lote');

const AjusteInventario = sequelize.define('AjusteInventario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tipo: {
    type: DataTypes.ENUM('Entrada', 'Salida'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'AjustesInventario',
  timestamps: true,
});

AjusteInventario.belongsTo(Lote, { foreignKey: 'loteId' });

module.exports = AjusteInventario;
