require('dotenv').config();
const app = require('./src/app');
const { connectWithRetry, pool } = require('./src/config/database'); // Importar connectWithRetry y pool

const PORT = process.env.PORT || 3000;

// Función para intentar conectar a la base de datos
async function connectDB() {
  try {
    await connectWithRetry(); // Usar connectWithRetry para manejar reconexiones
    console.log('Conexión exitosa a SQL Server');
    return true;
  } catch (err) {
    console.error('Error al conectar a SQL Server:', err);
    return false;
  }
}

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
  await pool.close(); // Cerrar el pool de conexiones
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Señal SIGINT recibida. Cerrando servidor...');
  await pool.close(); // Cerrar el pool de conexiones
  process.exit(0);
});