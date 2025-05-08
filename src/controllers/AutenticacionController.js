import { executeQuery, sql } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;

  // Validación mejorada
  if (!nombre || !correo || !contraseña || !rol) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios',
      requiredFields: ['nombre', 'correo', 'contraseña', 'rol']
    });
  }

  try {
    // Verificar correo existente
    const { recordset } = await executeQuery(
      'SELECT id FROM Usuarios WHERE correo = @correo',
      [{ name: 'correo', value: correo, type: sql.NVarChar(100) }]
    );

    if (recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Insertar usuario
    await executeQuery(
      `INSERT INTO Usuarios (nombre, correo, contraseña, rol) 
       VALUES (@nombre, @correo, @contraseña, @rol)`,
      [
        { name: 'nombre', value: nombre, type: sql.NVarChar(100) },
        { name: 'correo', value: correo, type: sql.NVarChar(100) },
        { name: 'contraseña', value: hashedPassword, type: sql.NVarChar(255) },
        { name: 'rol', value: rol, type: sql.NVarChar(50) }
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  const { correo, contraseña } = req.body;

  // Validación mejorada
  if (!correo || !contraseña) {
    return res.status(400).json({
      success: false,
      message: 'Correo y contraseña son obligatorios'
    });
  }

  try {
    // Buscar usuario
    const { recordset } = await executeQuery(
      `SELECT id, nombre, correo, contraseña, rol 
       FROM Usuarios WHERE correo = @correo`,
      [{ name: 'correo', value: correo, type: sql.NVarChar(100) }]
    );

    if (recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = recordset[0];
    const contraseñaValida = await bcrypt.compare(contraseña, user.contraseña);

    if (!contraseñaValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
      },
      process.env.JWT_SECRET || 'secret_default'
    );

    // Eliminar contraseña del objeto de respuesta
    delete user.contraseña;

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      token,
      usuario: user
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};