const https = require('https');
const querystring = require('querystring');

// Test the admin panel endpoints directly
async function testAdminEndpoints() {
  console.log('🔍 TESTING ADMIN PANEL API ENDPOINTS');
  console.log('====================================');
  
  const baseUrl = 'digiboard-admin-h01oj5d1r-adityas-projects-dbc75222.vercel.app';
  
  // Test 1: Check if the login page loads
  console.log('\n1. Testing login page...');
  await testGetRequest(baseUrl, '/login');
  
  // Test 2: Check if the lectures page redirects (authentication)
  console.log('\n2. Testing lectures page (should redirect to login)...');
  await testGetRequest(baseUrl, '/lectures');
  
  // Test 3: Check if the lectures/save endpoint exists (will fail auth but should not 404)
  console.log('\n3. Testing lectures/save endpoint...');
  await testPostRequest(baseUrl, '/lectures/save', { test: 'data' });
  
  // Test 4: Check available routes by testing common ones
  console.log('\n4. Testing other routes...');
  const routes = ['/status', '/api/health', '/dashboard'];
  for (let route of routes) {
    await testGetRequest(baseUrl, route);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
}

function testGetRequest(host, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'AdminPanel-Diagnostic/1.0'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   GET ${path}: ${res.statusCode} ${res.statusMessage}`);
      if (res.headers.location) {
        console.log(`   → Redirects to: ${res.headers.location}`);
      }
      resolve();
    });

    req.on('error', (e) => {
      console.log(`   GET ${path}: ERROR - ${e.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`   GET ${path}: TIMEOUT`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

function testPostRequest(host, path, data) {
  return new Promise((resolve) => {
    const postData = querystring.stringify(data);
    
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'AdminPanel-Diagnostic/1.0'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   POST ${path}: ${res.statusCode} ${res.statusMessage}`);
      if (res.headers.location) {
        console.log(`   → Redirects to: ${res.headers.location}`);
      }
      resolve();
    });

    req.on('error', (e) => {
      console.log(`   POST ${path}: ERROR - ${e.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`   POST ${path}: TIMEOUT`);
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testAdminEndpoints().then(() => {
  console.log('\n✅ Endpoint testing complete');
}).catch(console.error);
