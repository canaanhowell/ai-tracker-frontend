const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log(`Opening https://ai-tracker-466821.web.app at ${new Date().toISOString()}`);
  await page.goto('https://ai-tracker-466821.web.app');
  
  // Wait for content
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'right-now.png', fullPage: true });
  console.log('Screenshot taken');
  
  // Get exact table content
  const tableHTML = await page.$eval('tbody', el => el.innerHTML);
  console.log('\nEXACT TABLE HTML:');
  console.log(tableHTML.substring(0, 200) + '...');
  
  await browser.close();
})();