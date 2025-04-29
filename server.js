import app from './app.js';
import dotenv from 'dotenv';
import './src/config/db.js'; // Solo importa, no necesitas volver a conectar aquí

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const poolConnect = pool.connect().then(() => {
  console.log('Connected to SQL Server successfully.');
});