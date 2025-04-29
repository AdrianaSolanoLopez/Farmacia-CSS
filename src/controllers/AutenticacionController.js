import sql from 'mssql';
import pool from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const AutenticacionController = {
  register: async (req, res) => {
    const { nombre, correo, contraseña, rol } = req.body;

    try {
      // Verificar si el correo ya está registrado
      const correoExistente = await pool.request()
        .input('correo', sql.NVarChar, correo)
        .query('SELECT * FROM Usuarios WHERE correo = @correo');

      if (correoExistente.recordset.length > 0) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(contraseña, 10);

      // Insertar el nuevo usuario en la base de datos
      await pool.request()
        .input('nombre', sql.NVarChar, nombre)
        .input('correo', sql.NVarChar, correo)
        .input('contraseña', sql.NVarChar, hashedPassword)
        .input('rol', sql.NVarChar, rol)
        .query('INSERT INTO Usuarios (nombre, correo, contraseña, rol) VALUES (@nombre, @correo, @contraseña, @rol)');

      res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al registrar el usuario' });
    }
  },

  login: async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
      // Buscar el usuario en la base de datos
      const usuario = await pool.request()
        .input('correo', sql.NVarChar, correo)
        .query('SELECT * FROM Usuarios WHERE correo = @correo');

      if (usuario.recordset.length === 0) {
        return res.status(404).json({ message: 'Correo o contraseña incorrectos' });
      }

      const user = usuario.recordset[0];

      // Comparar la contraseña ingresada con la contraseña hasheada
      const contraseñaValida = await bcrypt.compare(contraseña, user.contraseña);

      if (!contraseñaValida) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }

      // Crear un token JWT
      const token = jwt.sign(
        { usuarioId: user.usuario_id, rol: user.rol },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      res.json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al iniciar sesión' });
    }
  },
};

export default AutenticacionController;
