import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
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
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Crear el pool de conexiones
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect(); // Esto retorna una promesa

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Error en el pool de la base de datos:', err);
});

// Función para ejecutar procedimientos almacenados
export async function executeStoredProcedure(procedureName, params = []) {
  try {
    await poolConnect; // Esperamos la conexión
    const request = pool.request();

    // Agregar parámetros al request
    params.forEach((param) => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}

// Exportar pool para su uso en otros archivos
export { pool };

// Exportar el objeto `sql` si lo necesitas para otras consultas
export default sql;
