const serverless = require('serverless-http');

// Try different require paths based on build environment
let app;
try {
  // Try relative path from functions directory
  app = require('../../server');
} catch (error) {
  try {
    // Try absolute path from project root
    app = require('/opt/build/repo/server');
  } catch (error2) {
    try {
      // Try another common Netlify path
      app = require('./../../server');
    } catch (error3) {
      console.error('Failed to load server:', error3);
      throw error3;
    }
  }
}

// Export the serverless handler
exports.handler = serverless(app);
