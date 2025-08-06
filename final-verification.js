const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  
  console.log('=== TESTING PRODUCTION DASHBOARD ===\n');
  
  // Go to site
  await page.goto('https://ai-tracker-466821.web.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // 1. Initial state
  console.log('1. INITIAL PAGE LOAD:');
  const initialRows = await page.$$eval('tbody tr', rows => rows.length);
  const firstRowText = await page.$eval('tbody tr:first-child', el => el.textContent.trim());
  console.log(`   - Table has ${initialRows} rows`);
  console.log(`   - First row: ${firstRowText.substring(0, 50)}...`);
  
  // 2. Test 30d button
  console.log('\n2. CLICKING 30d BUTTON:');
  await page.click('.time-btn[data-period="30d"]');
  await page.waitForTimeout(2000);
  
  const after30dRows = await page.$$eval('tbody tr', rows => rows.length);
  const after30dFirst = await page.$eval('tbody tr:first-child', el => el.textContent.trim());
  console.log(`   - Table has ${after30dRows} rows`);
  console.log(`   - First row: ${after30dFirst.substring(0, 50)}...`);
  
  // 3. Test platform buttons
  console.log('\n3. PLATFORM BUTTONS:');
  const platformVisible = await page.isVisible('.platform-filters');
  console.log(`   - Platform buttons visible: ${platformVisible}`);
  
  if (platformVisible) {
    // Toggle Reddit off
    await page.click('.platform-btn[data-platform="reddit"]');
    await page.waitForTimeout(2000);
    const afterRedditOff = await page.$eval('tbody tr:first-child', el => el.textContent.trim());
    console.log(`   - After Reddit OFF: ${afterRedditOff.substring(0, 40)}...`);
  }
  
  // 4. Test category dropdown
  console.log('\n4. CATEGORY DROPDOWN:');
  await page.click('.dropdown-toggle');
  await page.waitForTimeout(500);
  const dropdownOpen = await page.$eval('.category-dropdown', el => el.classList.contains('open'));
  console.log(`   - Dropdown opens: ${dropdownOpen}`);
  
  // Take final screenshot
  await page.screenshot({ path: 'final-state.png', fullPage: true });
  console.log('\n=== Screenshot saved: final-state.png ===');
  
  await browser.close();
})();