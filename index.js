require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Función para intentar conectar a la base de datos
const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('Conexión con la base de datos establecida con éxito.');
      return true;
    } catch (error) {
      console.error(`Intento ${i + 1} de ${retries} fallido:`, error.message);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

// Función para iniciar el servidor
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  });
};

// Iniciar la aplicación
(async () => {
  try {
    const isConnected = await connectDB();
    if (isConnected) {
      startServer();
    } else {
      console.error('No se pudo establecer conexión con la base de datos después de múltiples intentos');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error crítico al iniciar la aplicación:', error);
    process.exit(1);
  }
})();

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
  console.log('Señal SIGTERM recibida. Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Señal SIGINT recibida. Cerrando servidor...');
  await pool.end();
  process.exit(0);
});