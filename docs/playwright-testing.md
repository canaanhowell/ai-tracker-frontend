# Playwright Testing Setup

## Overview
This document outlines the Playwright testing setup for the frontend dashboard to ensure visual and functional quality before deployment.

## Installation

### 1. Install Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. System Dependencies (if needed)
```bash
sudo npx playwright install-deps
```

## Configuration

### playwright.config.js
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Suite

### Dashboard Layout Tests (`tests/dashboard.spec.js`)

The comprehensive test suite covers:

1. **Top Bar Components** 
   - Time filter buttons (7d, 30d, 90d) with active states
   - Platform filter buttons (All, Reddit, YouTube)
   - Category dropdown with dynamic Firebase options
   - Default states and button interactions

2. **Layout Structure**
   - Two-column grid layout (1fr:2fr ratio)
   - Left column: rankings and trending tables
   - Right column: performance chart matching table heights
   - Responsive breakpoints at 900px

3. **Data Display**
   - Rankings table with live Firebase data (Rank, Name, Category, Post Count)
   - Trending table with Product Hunt integration
   - Chart canvas with top 3 products and real metrics
   - Proper text formatting (cleaned names and categories)

4. **Advanced Functionality**
   - Dynamic chart updates based on filter selections
   - Live data filtering by category and platform
   - Time period chart axis updates (7d/30d/90d)
   - Real date labels instead of relative time

5. **Performance Features**
   - Optimized loading with pre-sorted Firebase data
   - No client-side sorting for improved speed
   - Invalid data filtering and validation

6. **Responsive Design & Visual Testing**
   - Mobile viewport testing with single-column layout
   - Element visibility and interaction across screen sizes
   - Full dashboard screenshots for visual regression
   - Component-specific verification (topbar, content, chart)

## Running Tests

### Local Testing
```bash
# Run all tests
npx playwright test

# Run with headed browser (if display available)
npx playwright test --headed

# Run specific test file
npx playwright test tests/dashboard.spec.js

# Generate test report
npx playwright show-report
```

### CI/CD Integration
```bash
# Run in headless mode (default)
npx playwright test

# Run with retries in CI
CI=true npx playwright test
```

## Screenshots

Test screenshots are saved to `tests/screenshots/`:
- `dashboard-full.png` - Complete dashboard view
- `topbar.png` - Top navigation bar
- `dashboard-content.png` - Main content area

## Issues Found and Fixed

### Mobile Responsive CSS Issue
**Problem**: CSS media queries referenced old class names after UI refactor
**Solution**: Updated mobile responsive styles to use new class names:
- `.filter-buttons` → `.filter-controls`
- `.filter-btn` → `.time-btn`
- Added proper mobile styling for dropdown

**Fixed in**: `styles.css` lines 293-332

### Layout Improvements
- Fixed mobile layout stacking (vertical filter controls)
- Adjusted button sizing for mobile devices
- Improved dropdown responsiveness

## Best Practices

1. **Always test before deploying**
   ```bash
   npx playwright test && npm run deploy
   ```

2. **Visual regression testing**
   - Take screenshots during tests
   - Compare against baseline images
   - Review visual changes before deployment

3. **Cross-browser testing**
   - Test on Chrome, Firefox, Safari
   - Verify responsive behavior
   - Check interactive elements

4. **Accessibility testing**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast validation

## Troubleshooting

### System Dependencies Missing
If you see browser dependency errors:
```bash
sudo npx playwright install-deps
```

### Port Already in Use
If port 3000 is busy:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in config
```

### Headless Mode Issues
In Docker/WSL environments without display:
```bash
# Force headless mode
PLAYWRIGHT_HEADLESS=true npx playwright test
```

## Future Enhancements

1. **Performance Testing**
   - Load time measurements
   - Chart rendering performance
   - Memory usage monitoring

2. **API Integration Testing**
   - Mock data endpoints
   - Real-time data updates
   - Error handling scenarios

3. **Advanced Visual Testing**
   - Cross-browser screenshot comparison
   - Automated visual diff detection
   - Responsive breakpoint testing

## Resources
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Testing Guide](https://playwright.dev/docs/test-screenshots)