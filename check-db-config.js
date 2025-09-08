// Check what database the admin panel server.js is actually connecting to
const fs = require('fs');

require('dotenv').config();
console.log('🔍 Admin Panel Database Configuration');
console.log('=====================================');

console.log('MONGODB_URI from .env exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  
  // Extract database name
  const dbMatch = uri.match(/\/([^?]+)/);
  if (dbMatch) {
    console.log('Database name from URI:', dbMatch[1]);
  }
  
  // Extract cluster info  
  const clusterMatch = uri.match(/@([^/]+)/);
  if (clusterMatch) {
    console.log('Cluster:', clusterMatch[1]);
  }
  
  console.log('Full URI (masked):', uri.replace(/:[^@]+@/, ':***@'));
}

// Check the server.js file for any hardcoded values
const serverContent = fs.readFileSync('server.js', 'utf8');
const mongoUriMatch = serverContent.match(/process\.env\.MONGODB_URI\s*\|\|\s*'([^']+)'/);
if (mongoUriMatch) {
  console.log('Default fallback URI in server.js:', mongoUriMatch[1]);
}
