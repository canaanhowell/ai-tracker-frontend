const { chromium } = require('playwright');

(async () => {
  // Use incognito context to avoid any caching
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Clear all storage
    storageState: undefined,
    // Disable cache
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  // Disable cache for this session
  await page.route('**/*', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache',
      }
    });
  });
  
  console.log('Opening fresh browser with no cache...');
  await page.goto('https://ai-tracker-466821.web.app', { waitUntil: 'networkidle' });
  
  // Initial state
  console.log('\n=== INITIAL PAGE LOAD ===');
  const initialTable = await page.$eval('tbody', el => {
    const rows = el.querySelectorAll('tr');
    return rows.length > 0 ? `${rows.length} rows` : 'EMPTY TABLE';
  });
  console.log('Table state:', initialTable);
  
  // Take initial screenshot
  await page.screenshot({ path: 'fresh-initial.png', fullPage: true });
  
  // Try interacting
  console.log('\n=== TESTING INTERACTIONS ===');
  
  // Check if New button is active
  const newBtnClass = await page.$eval('.time-btn[data-period="new"]', el => el.className);
  console.log('New button classes:', newBtnClass);
  
  // Click 30d
  await page.click('.time-btn[data-period="30d"]');
  await page.waitForTimeout(3000);
  
  const after30d = await page.$eval('tbody', el => {
    const rows = el.querySelectorAll('tr');
    return rows.length > 0 ? `${rows.length} rows` : 'EMPTY TABLE';
  });
  console.log('After 30d click:', after30d);
  
  // Final screenshot
  await page.screenshot({ path: 'fresh-after-30d.png', fullPage: true });
  
  await browser.close();
})();