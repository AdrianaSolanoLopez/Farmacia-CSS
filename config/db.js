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
    idleTimeoutMillis: 30000
  }
};

// Create connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('Database pool error:', err);
});

export async function executeStoredProcedure(procedureName, params = []) {
  try {
    await poolConnect;
    const request = pool.request();

    // Add parameters to request
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error(`Error executing stored procedure ${procedureName}:`, error);
    throw error;
  }
}


export default pool;