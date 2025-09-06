const serverless = require('serverless-http');

// Import the main server app
const app = require('../../server.js');

// Create the serverless handler with proper configuration
const handler = serverless(app, {
  binary: false,
  callbackWaitsForEmptyEventLoop: false
});

// Export the handler
exports.handler = async (event, context) => {
  // Set the context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Call the serverless handler
  return await handler(event, context);
};
