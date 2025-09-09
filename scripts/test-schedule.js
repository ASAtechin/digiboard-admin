const axios = require('axios');

async function testSchedule() {
  try {
    // Create a cookie jar to maintain session
    const axiosInstance = axios.create({
      baseURL: 'http://localhost:3001',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Login first
    console.log('Logging in...');
    const loginResponse = await axiosInstance.post('/login', 'username=admin&password=admin123');
    console.log('Login status:', loginResponse.status);

    // Get the cookies from login response
    const cookies = loginResponse.headers['set-cookie'];
    
    // Access schedule with cookies
    console.log('Accessing schedule...');
    const scheduleResponse = await axiosInstance.get('/schedule', {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : ''
      }
    });
    
    console.log('Schedule status:', scheduleResponse.status);
    console.log('Schedule content includes "lecture":', scheduleResponse.data.includes('lecture'));
    console.log('Schedule content includes "Monday":', scheduleResponse.data.includes('Monday'));
    
  } catch (error) {
    console.error('Test error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testSchedule();
