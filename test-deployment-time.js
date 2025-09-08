// Simple test to check if the deployment has updated
const https = require('https');
const querystring = require('querystring');

function makeRequest(url, method = 'GET', data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigiBoard-Test/1.0)',
        'Cookie': cookies
      }
    };

    if (data && method === 'POST') {
      const postData = querystring.stringify(data);
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method === 'POST') {
      req.write(querystring.stringify(data));
    }

    req.end();
  });
}

async function testTimeDebugging() {
  console.log('Testing time debugging endpoint...');
  
  try {
    // Test the health endpoint to see if deployment is updated
    const healthResponse = await makeRequest('https://digiboard-admin.vercel.app/api/health');
    console.log('Health response:', healthResponse.body);
    
    // Create a minimal test endpoint request
    console.log('\\nChecking deployment timestamp...');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTimeDebugging();
