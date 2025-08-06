const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Going to ACTUAL production site...');
  await page.goto('https://ai-tracker-466821.web.app');
  
  // Wait for any JavaScript to execute
  await page.waitForTimeout(5000);
  
  // 1. Check table content
  const tableHTML = await page.$eval('tbody', el => el.innerHTML);
  console.log('\n=== ACTUAL TABLE CONTENT ===');
  console.log(tableHTML.trim() || '[COMPLETELY EMPTY]');
  
  // 2. Check if buttons are clickable
  console.log('\n=== BUTTON STATES ===');
  
  // Check time buttons
  const timeButtons = await page.$$eval('.time-btn', buttons => 
    buttons.map(btn => ({
      text: btn.textContent,
      disabled: btn.disabled,
      classes: btn.className
    }))
  );
  console.log('Time buttons:', timeButtons);
  
  // 3. Try clicking 30d and see what happens
  console.log('\n=== CLICKING 30d BUTTON ===');
  try {
    await page.click('.time-btn[data-period="30d"]');
    console.log('Click successful');
    await page.waitForTimeout(3000);
    
    // Check table after click
    const tableAfter = await page.$eval('tbody', el => el.innerHTML);
    console.log('\nTable after 30d click:');
    console.log(tableAfter.trim() || '[STILL EMPTY]');
  } catch (e) {
    console.log('FAILED to click:', e.message);
  }
  
  // 4. Take screenshot
  await page.screenshot({ path: 'user-actual-view.png', fullPage: true });
  console.log('\n=== SCREENSHOT SAVED: user-actual-view.png ===');
  
  // 5. Check for ANY console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Reload to catch errors
  await page.reload();
  await page.waitForTimeout(3000);
  
  if (errors.length > 0) {
    console.log('\n=== JAVASCRIPT ERRORS ===');
    errors.forEach(err => console.log('ERROR:', err));
  }
  
  await browser.close();
})();