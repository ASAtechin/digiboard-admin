const serverless = require('serverless-http');
const path = require('path');

// Set NODE_PATH to help with module resolution
process.env.NODE_PATH = process.env.NODE_PATH ? 
  `${process.env.NODE_PATH}:${process.cwd()}` : 
  process.cwd();

// Require the main app from project root
const app = require('../../server.js');

// Export handler
exports.handler = serverless(app);
