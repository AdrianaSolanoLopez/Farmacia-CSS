const express = require('express');
//const cors = require('cors');
//const apiRoutes = require('./routes/api');

const app = express();

// CORS configuration
//const allowedOrigins = [process.env.ALLOWED_ORIGINS];


// API routes
//app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

module.exports = app;