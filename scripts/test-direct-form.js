// Test form submission with correct form structure
const https = require('https');
const querystring = require('querystring');

// Function to extract session cookie from login
function extractCookies(headers) {
  const cookies = [];
  if (headers['set-cookie']) {
    headers['set-cookie'].forEach(cookie => {
      // Extract just the session cookie value (looking for digiboard.sid)
      if (cookie.includes('digiboard.sid=')) {
        cookies.push(cookie.split(';')[0]);
      }
    });
  }
  return cookies.join('; ');
}

// Function to make HTTP request with cookies
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

async function testFormSubmissionDirect() {
  console.log('Testing direct form submission...');

  try {
    // Step 1: Login and get session cookie
    console.log('\n1. Logging in...');
    const loginData = {
      username: 'admin',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest(
      'https://digiboard-admin.vercel.app/login',
      'POST',
      loginData
    );
    
    console.log(`Login Status: ${loginResponse.statusCode}`);
    console.log('Login Response Headers:', loginResponse.headers);
    const sessionCookie = extractCookies(loginResponse.headers);
    console.log(`Session Cookie: ${sessionCookie ? 'Found: ' + sessionCookie : 'Not found'}`);

    if (!sessionCookie) {
      console.log('No session cookie found, cannot proceed');
      return;
    }

    // Step 2: Get current lecture count
    console.log('\n2. Getting current lecture count...');
    const statusResponse = await makeRequest(
      'https://digiboard-admin.vercel.app/status',
      'GET',
      null,
      sessionCookie
    );
    
    const statusData = JSON.parse(statusResponse.body);
    console.log(`Current lecture count: ${statusData.lectureCount || 'unknown'}`);

    // Step 3: Submit lecture form
    console.log('\n3. Submitting lecture form...');
    const lectureData = {
      teacher: '676b421b3f1e3f4b62e5b5e3', // Using a known teacher ID
      subject: 'Test Subject Time Fix',
      classroom: 'Room 888', 
      dayOfWeek: 'Tuesday', 
      startTime: '14:00', // HTML time input format
      endTime: '15:00',   // HTML time input format
      semester: 'Fall 2024',
      course: 'TEST102'
    };

    const submitResponse = await makeRequest(
      'https://digiboard-admin.vercel.app/lectures/save',
      'POST',
      lectureData,
      sessionCookie
    );

    console.log(`Submit Status: ${submitResponse.statusCode}`);
    console.log(`Submit Response Headers:`, submitResponse.headers);
    
    // Check for redirect
    if (submitResponse.headers.location) {
      console.log(`Redirected to: ${submitResponse.headers.location}`);
      
      // Follow redirect to see success/error message
      const redirectResponse = await makeRequest(
        `https://digiboard-admin.vercel.app${submitResponse.headers.location}`,
        'GET',
        null,
        sessionCookie
      );
      
      console.log(`Redirect Status: ${redirectResponse.statusCode}`);
      
      // Check for success or error messages in the response
      const responseBody = redirectResponse.body;
      if (responseBody.includes('alert-success')) {
        console.log('✅ SUCCESS: Lecture saved successfully!');
      } else if (responseBody.includes('alert-danger')) {
        const errorMatch = responseBody.match(/alert-danger[^>]*>([^<]+)/);
        console.log(`❌ ERROR: ${errorMatch ? errorMatch[1].trim() : 'Unknown error'}`);
      } else {
        console.log('No clear success/error message found');
      }
    }

    // Step 4: Check if lecture count increased
    console.log('\n4. Checking updated lecture count...');
    const updatedStatusResponse = await makeRequest(
      'https://digiboard-admin.vercel.app/status',
      'GET',
      null,
      sessionCookie
    );
    
    const updatedStatusData = JSON.parse(updatedStatusResponse.body);
    console.log(`Updated lecture count: ${updatedStatusData.lectureCount || 'unknown'}`);
    
    if (updatedStatusData.lectureCount > statusData.lectureCount) {
      console.log('✅ SUCCESS: Lecture count increased!');
    } else {
      console.log('❌ ISSUE: Lecture count did not increase');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFormSubmissionDirect();
