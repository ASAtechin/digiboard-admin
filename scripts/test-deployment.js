// Simple test to check the deployed admin panel status
const https = require('https');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigiBoard-Test/1.0)',
      }
    };

    if (data && method === 'POST') {
      const postData = new URLSearchParams(data).toString();
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
          body: body,
          url: res.url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method === 'POST') {
      req.write(new URLSearchParams(data).toString());
    }

    req.end();
  });
}

async function testDeployment() {
  console.log('Testing deployed admin panel...');

  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await makeRequest('https://digiboard-admin.vercel.app/api/health');
    console.log(`Health Status: ${healthResponse.statusCode}`);
    console.log('Health Response:', healthResponse.body.substring(0, 200));

    // Test status endpoint
    console.log('\n2. Testing status endpoint...');
    const statusResponse = await makeRequest('https://digiboard-admin.vercel.app/status');
    console.log(`Status Code: ${statusResponse.statusCode}`);
    console.log('Status Response:', statusResponse.body.substring(0, 200));

    // Test login page
    console.log('\n3. Testing login page...');
    const loginResponse = await makeRequest('https://digiboard-admin.vercel.app/login');
    console.log(`Login Status: ${loginResponse.statusCode}`);
    console.log('Login page loaded:', loginResponse.body.includes('<form') ? 'Yes' : 'No');

    // Test lectures page (should redirect to login)
    console.log('\n4. Testing lectures page (should redirect)...');
    const lecturesResponse = await makeRequest('https://digiboard-admin.vercel.app/lectures');
    console.log(`Lectures Status: ${lecturesResponse.statusCode}`);
    console.log('Redirect location:', lecturesResponse.headers.location || 'None');

    console.log('\nDeployment test completed.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDeployment();
