import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler.js';

// Import routes

import actasRoutes from './routes/recepcionRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/actas', actasRoutes);


// Error handling
app.use(errorHandler);

export default app;

// productos --------------------
const express = require('express');
//const app = express(); (sale error porque esta duplicado)

const productoRoutes = require('./routes/productoRoutes');

app.use(express.json());
app.use('/api/productos', productoRoutes);

module.exports = app;
