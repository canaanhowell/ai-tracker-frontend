import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the dashboard to load
    await page.waitForSelector('.dashboard');
  });

  test('should display top bar with time filters and category dropdown', async ({ page }) => {
    // Check top bar exists
    await expect(page.locator('.topbar')).toBeVisible();
    
    // Check time filter buttons (New button removed)
    await expect(page.locator('.time-btn[data-period="30d"]')).toBeVisible();
    await expect(page.locator('.time-btn[data-period="90d"]')).toBeVisible();
    
    // Check "30d" is active by default
    await expect(page.locator('.time-btn[data-period="30d"]')).toHaveClass(/active/);
    
    // Check filter labels are visible
    await expect(page.locator('.filter-label')).toHaveCount(2);
    await expect(page.locator('.time-filters .filter-label')).toContainText('Period:');
    await expect(page.locator('.platform-filters .filter-label')).toContainText('Platform:');
    
    // Check platform buttons are visible
    await expect(page.locator('.platform-filters')).toBeVisible();
    
    // Check category dropdown
    await expect(page.locator('.category-dropdown')).toBeVisible();
    await expect(page.locator('.dropdown-toggle')).toBeVisible();
    await expect(page.locator('.dropdown-toggle span')).toContainText('All Categories');
  });

  test('should have proper two-column layout', async ({ page }) => {
    // Check dashboard grid layout
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // Check left column (ranking table)
    await expect(page.locator('.left-column')).toBeVisible();
    await expect(page.locator('.ranking-table').first()).toBeVisible();
    
    // Check right column (charts)
    await expect(page.locator('.right-column')).toBeVisible();
    await expect(page.locator('.chart-container').first()).toBeVisible();
  });

  test('should display ranking table with data', async ({ page }) => {
    // Check first table structure
    const firstTable = page.locator('table').first();
    await expect(firstTable).toBeVisible();
    await expect(firstTable.locator('thead th')).toHaveCount(4);
    
    // Check headers of first table
    await expect(firstTable.locator('thead th').nth(0)).toContainText('Rank');
    await expect(firstTable.locator('thead th').nth(1)).toContainText('Name');
    await expect(firstTable.locator('thead th').nth(2)).toContainText('Category');
    await expect(firstTable.locator('thead th').nth(3)).toContainText('Post Count');
    
    // Wait for data to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // Check data rows exist
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should display chart with legend', async ({ page }) => {
    // Check chart canvas
    await expect(page.locator('#performanceChart')).toBeVisible();
    
    // Check chart legend container
    await expect(page.locator('.chart-legend')).toBeVisible();
    
    // Check legend shows loading state initially (since we clear hardcoded data)
    await expect(page.locator('.chart-legend')).toContainText('Loading chart data');
  });

  test('should show platform buttons when switching to 30d/90d', async ({ page }) => {
    // Platform buttons should be visible by default
    await expect(page.locator('.platform-filters')).toBeVisible();
    
    // Click 30d button
    const btn30d = page.locator('.time-btn[data-period="30d"]');
    await btn30d.click();
    
    // Platform buttons should now be visible
    await expect(page.locator('.platform-filters')).toBeVisible();
    await expect(page.locator('.platform-btn[data-platform="reddit"]')).toBeVisible();
    await expect(page.locator('.platform-btn[data-platform="youtube"]')).toBeVisible();
    
    // All should be active by default, others inactive
    await expect(page.locator('.platform-btn[data-platform="all"]')).toHaveClass(/active/);
    await expect(page.locator('.platform-btn[data-platform="reddit"]')).not.toHaveClass(/active/);
    await expect(page.locator('.platform-btn[data-platform="youtube"]')).not.toHaveClass(/active/);
  });

  test('should interact with platform toggle buttons', async ({ page }) => {
    const redditBtn = page.locator('.platform-btn[data-platform="reddit"]');
    const youtubeBtn = page.locator('.platform-btn[data-platform="youtube"]');
    
    // Both should start active by default (Reddit not active initially)
    await expect(redditBtn).not.toHaveClass(/active/);
    await expect(youtubeBtn).not.toHaveClass(/active/);
    
    // Toggle Reddit on
    await redditBtn.click();
    await expect(redditBtn).toHaveClass(/active/);
    
    // Toggle YouTube on
    await youtubeBtn.click();
    await expect(youtubeBtn).toHaveClass(/active/);
  });

  test('should interact with category dropdown', async ({ page }) => {
    const dropdown = page.locator('.category-dropdown');
    const toggle = page.locator('.dropdown-toggle');
    const menu = page.locator('.dropdown-menu');
    
    // Initially dropdown should be closed
    await expect(menu).not.toHaveClass(/open/);
    await expect(menu).not.toBeVisible();
    
    // Click to open dropdown
    await toggle.click();
    await expect(menu).toHaveClass(/open/);
    await expect(menu).toBeVisible();
    
    // Wait for dynamic categories to load and check at least "All Categories" exists
    await expect(page.locator('.dropdown-item[data-category="all"]')).toBeVisible();
    
    // Wait a moment for Firebase categories to load
    await page.waitForTimeout(2000);
    
    // Get all dropdown items (should include dynamic categories from Firebase)
    const dropdownItems = page.locator('.dropdown-item');
    const itemCount = await dropdownItems.count();
    
    // Should have at least "All Categories" plus some Firebase categories
    expect(itemCount).toBeGreaterThan(1);
    
    // Select the second category (first dynamic one after "All Categories")
    if (itemCount > 1) {
      const secondItem = dropdownItems.nth(1);
      const categoryText = await secondItem.textContent();
      await secondItem.click();
      
      // Check dropdown closes and label updates
      await expect(menu).not.toHaveClass(/open/);
      await expect(page.locator('.dropdown-toggle span')).toContainText(categoryText);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check elements are still visible
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.left-column')).toBeVisible();
    await expect(page.locator('.right-column')).toBeVisible();
  });

  test('should handle 430px iPhone width', async ({ page }) => {
    // Set iPhone 14 Pro viewport (430px)
    await page.setViewportSize({ width: 430, height: 932 });
    
    // Wait for Firebase to load and data to be available
    await page.waitForTimeout(5000);
    
    // Take screenshot to debug layout
    await page.screenshot({ path: 'tests/screenshots/iphone-430px.png', fullPage: true });
    
    // Check layout is responsive (both columns should be visible)
    await expect(page.locator('.left-column')).toBeVisible();
    await expect(page.locator('.right-column')).toBeVisible();
  });

  test('should take visual screenshot', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-full.png',
      fullPage: true 
    });
    
    // Take screenshot of just the top bar
    await page.locator('.topbar').screenshot({
      path: 'tests/screenshots/topbar.png'
    });
    
    // Take screenshot of dashboard content
    await page.locator('.dashboard').screenshot({
      path: 'tests/screenshots/dashboard-content.png'
    });
  });
});