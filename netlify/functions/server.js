const serverless = require('serverless-http');

// Load the main server application
const app = require('../../server');

// Export the serverless handler
exports.handler = serverless(app);
