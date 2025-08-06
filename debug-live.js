const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture ALL console messages including errors
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });
  
  await page.goto('https://ai-tracker-466821.web.app');
  
  // Wait and check
  await page.waitForTimeout(5000);
  
  // Check if tbody has any content at all
  const tbodyContent = await page.$eval('tbody', el => el.innerHTML.trim());
  console.log('\n=== TBODY Content ===');
  console.log(tbodyContent || 'EMPTY');
  
  // Check if buttons are actually clickable
  try {
    await page.click('.time-btn[data-period="30d"]');
    console.log('\n30d button clicked successfully');
  } catch (e) {
    console.log('\nFAILED to click 30d button:', e.message);
  }
  
  await page.waitForTimeout(2000);
  
  // Check tbody again after click
  const tbodyAfter = await page.$eval('tbody', el => el.innerHTML.trim());
  console.log('\n=== TBODY After Click ===');
  console.log(tbodyAfter || 'EMPTY');
  
  await browser.close();
})();