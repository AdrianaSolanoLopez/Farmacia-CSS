//5. Modelo: Proveedor

// models/Proveedor.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nit: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  correo: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true,
    },
  },
  telefono: {
    type: DataTypes.STRING,
  },
  direccion: {
    type: DataTypes.STRING,
  },
  contacto: {
    type: DataTypes.STRING,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Proveedores',
  timestamps: true,
});

module.exports = Proveedor;
