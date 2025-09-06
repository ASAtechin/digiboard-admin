const serverless = require('serverless-http');

// Import the main server app
const app = require('../../server');

// Export the serverless handler
module.exports.handler = serverless(app);
