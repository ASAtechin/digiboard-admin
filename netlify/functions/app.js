const express = require('express');
const serverless = require('serverless-http');

// Create a simple Express app for testing
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test route
app.get('/', (req, res) => {
  res.json({
    message: 'DigiBoard Admin Dashboard - Serverless Function Working!',
    timestamp: new Date().toISOString(),
    environment: 'Netlify Functions'
  });
});

app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test endpoint working'
  });
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Export the serverless handler
exports.handler = serverless(app);
