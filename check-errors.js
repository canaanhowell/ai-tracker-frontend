const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    logs.push(`[${msg.type().toUpperCase()}] ${text}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });
  
  console.log('Loading page and waiting for all JavaScript...');
  await page.goto('https://ai-tracker-466821.web.app');
  
  // Wait for the 1 second timeout
  await page.waitForTimeout(2000);
  
  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach(err => console.log('!!! ' + err));
  } else {
    console.log('\n=== NO ERRORS ===');
  }
  
  await browser.close();
})();