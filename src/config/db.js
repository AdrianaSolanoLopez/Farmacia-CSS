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
    trustServerCertificate: true, // Solo para desarrollo
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Singleton del pool de conexiones
let pool;
let poolConnect;

export async function getPool() {
  if (!pool) {
    pool = new sql.ConnectionPool(dbConfig);
    poolConnect = pool.connect();

    pool.on('error', err => {
      console.error('Database pool error:', err);
    });

    try {
      await poolConnect;
      console.log('Connected to SQL Server');
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }
  return pool;
}

// Versión mejorada de executeStoredProcedure
export async function executeQuery(query, params = []) {
  const pool = await getPool();
  const request = pool.request();

  params.forEach(param => {
    request.input(param.name, param.type || sql.VarChar, param.value);
  });

  return await request.query(query);
}


export async function executeInsert(query, params) {
  const result = await executeQuery(query, params);
  return result.rowsAffected[0];
}

// Exportaciones
export { sql };