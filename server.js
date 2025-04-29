import app from './app.js';
import dotenv from 'dotenv';
import pool from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

(async () => {
  try {
    await pool.connect();
    console.log('Connected to SQL Server successfully.');
  } catch (error) {
    console.error('Failed to connect to SQL Server:', error.message);
    process.exit(1);
  }
})();
