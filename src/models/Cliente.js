//7. Modelo: Cliente
//Este modelo permite registrar a los clientes, en caso de que quieras guardar datos de quienes compran medicamentos.

// models/Cliente.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  identificacion: {
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
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Clientes',
  timestamps: true,
});

module.exports = Cliente;


