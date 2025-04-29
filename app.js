import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './src/routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use centralized routes
app.use('/api', router);

// Error handling
app.use(errorHandler);

export default app; // Export the app instance as default
