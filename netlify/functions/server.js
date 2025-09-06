const serverless = require('serverless-http');

// Now that we know the function works, let's restore the full app
const app = require('../../server.js');

// Export the serverless handler
exports.handler = serverless(app);
