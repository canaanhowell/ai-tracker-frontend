const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Go to production URL
  await page.goto('https://ai-tracker-466821.web.app');
  
  // Wait for JavaScript to execute
  await page.waitForTimeout(3000);
  
  // Print all console messages
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
  });
  
  // Check table content
  const tableContent = await page.textContent('tbody');
  console.log('\n=== Table Content ===');
  console.log(tableContent);
  
  await browser.close();
})();