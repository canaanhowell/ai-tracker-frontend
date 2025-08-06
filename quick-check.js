const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Loading page...');
  await page.goto('https://ai-tracker-466821.web.app');
  
  // Just wait a fixed time
  console.log('Waiting 5 seconds for content to load...');
  await page.waitForTimeout(5000);
  
  // Get table content
  try {
    const tableContent = await page.$eval('tbody', el => {
      const rows = el.querySelectorAll('tr');
      return `${rows.length} rows - First cell: ${rows[0]?.cells[0]?.textContent || 'empty'}`;
    });
    console.log('Table:', tableContent);
  } catch (e) {
    console.log('Error reading table:', e.message);
  }
  
  // Screenshot
  await page.screenshot({ path: 'quick-check.png', fullPage: true });
  console.log('Screenshot saved');
  
  await browser.close();
})();