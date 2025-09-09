const puppeteer = require('puppeteer');

async function testFormSubmission() {
  console.log('Testing form submission with browser automation...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    devtools: true 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log(`PAGE LOG: ${msg.text()}`);
    });
    
    // Enable network monitoring
    page.on('request', request => {
      console.log(`REQUEST: ${request.method()} ${request.url()}`);
      if (request.method() === 'POST') {
        console.log('POST DATA:', request.postData());
      }
    });
    
    page.on('response', response => {
      console.log(`RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    console.log('Navigating to login page...');
    await page.goto('https://digiboard-admin.vercel.app/login');
    
    // Login
    console.log('Logging in...');
    await page.type('#username', 'admin');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation();
    console.log('Current URL after login:', page.url());
    
    // Navigate to lectures page
    console.log('Navigating to lectures page...');
    await page.goto('https://digiboard-admin.vercel.app/lectures');
    
    // Fill out lecture form
    console.log('Filling out lecture form...');
    await page.select('#teacher', '676b421b3f1e3f4b62e5b5e3'); // First teacher ID
    await page.type('#subject', 'Test Subject Debug');
    await page.type('#room', 'Room 101');
    await page.select('#dayOfWeek', '1'); // Monday
    await page.type('#startTime', '09:00');
    await page.type('#endTime', '10:00');
    
    console.log('Submitting form...');
    
    // Wait for any network activity after form submission
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/lectures/save'), 
      { timeout: 10000 }
    ).catch(() => {
      console.log('No response received for /lectures/save');
      return null;
    });
    
    await page.click('button[type="submit"]');
    
    const response = await responsePromise;
    if (response) {
      console.log(`Form submission response: ${response.status()}`);
      console.log(`Response URL: ${response.url()}`);
    }
    
    // Wait a moment for any redirects
    await page.waitForTimeout(3000);
    
    console.log('Final URL:', page.url());
    
    // Check for any error/success messages
    const errorElement = await page.$('.alert-danger');
    const successElement = await page.$('.alert-success');
    
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log('ERROR MESSAGE:', errorText);
    }
    
    if (successElement) {
      const successText = await page.evaluate(el => el.textContent, successElement);
      console.log('SUCCESS MESSAGE:', successText);
    }
    
    // Check console for any JavaScript errors
    console.log('Test completed. Check the browser developer tools for additional logs.');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Don't close browser automatically for debugging
    console.log('Browser left open for manual inspection...');
    // await browser.close();
  }
}

testFormSubmission();
