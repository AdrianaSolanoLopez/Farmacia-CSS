const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10, // Número máximo de conexiones en el pool
    min: 0,  // Número mínimo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo máximo de inactividad
  },
};

// Crear el pool de conexiones
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect(); // Iniciar la conexión

// Función para manejar la conexión y ejecutar consultas
async function query(sqlQuery) {
  try {
    await poolConnect; // Asegurarse de que el pool está conectado
    const result = await pool.request().query(sqlQuery);
    return result.recordset;
  } catch (err) {
    console.error('Error al ejecutar la consulta:', err);
    throw err; // Relanzar el error para que pueda ser manejado externamente
  }
}

// Función para reintentar la conexión en caso de fallos
async function connectWithRetry(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await poolConnect; // Intentar reconectar
      console.log('Conectado a SQL Server');
      return; // Si la conexión es exitosa, salir del bucle
    } catch (err) {
      console.error(`Intento ${i + 1} de ${retries}: Error al conectar a SQL Server`, err);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay / 1000} segundos...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('No se pudo conectar a SQL Server después de varios intentos');
}

// Exportar las funciones y el pool
module.exports = {
  query,
  connectWithRetry,
  pool,
};