// src/controllers/AutenticacionController.js

import sql from 'mssql';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const AutenticacionController = {
  // Registro de nuevo usuario
  register: async (req, res) => {
    const { nombre, correo, contraseña, rol } = req.body;

    try {
      // Validar si el correo ya existe
      const { recordset: usuariosExistentes } = await pool.request()
        .input('correo', sql.NVarChar, correo)
        .query('SELECT id FROM Usuarios WHERE correo = @correo');

      if (usuariosExistentes.length > 0) {
        return res.status(400).json({ message: 'El correo ya está registrado.' });
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(contraseña, 10);

      // Insertar nuevo usuario
      await pool.request()
        .input('nombre', sql.NVarChar, nombre)
        .input('correo', sql.NVarChar, correo)
        .input('contraseña', sql.NVarChar, hashedPassword)
        .input('rol', sql.NVarChar, rol)
        .query(`
          INSERT INTO Usuarios (nombre, correo, contraseña, rol) 
          VALUES (@nombre, @correo, @contraseña, @rol)
        `);

      res.status(201).json({ message: 'Usuario registrado con éxito.' });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ message: 'Error al registrar el usuario.' });
    }
  },

  // Inicio de sesión
  login: async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
      // Buscar usuario por correo
      const { recordset } = await pool.request()
        .input('correo', sql.NVarChar, correo)
        .query('SELECT id, nombre, correo, contraseña, rol FROM Usuarios WHERE correo = @correo');

      if (recordset.length === 0) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
      }

      const user = recordset[0];

      // Verificar contraseña
      const contraseñaValida = await bcrypt.compare(contraseña, user.contraseña);
      if (!contraseñaValida) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
      }

      // Crear token JWT
      const token = jwt.sign(
        { id: user.id, rol: user.rol },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Inicio de sesión exitoso.',
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ message: 'Error al iniciar sesión.' });
    }
  }
};

export default AutenticacionController;
