# Frontend Development Guidelines

**Last Updated**: 2025-08-06

## 🚨 MANDATORY VISUAL TESTING

### Rule #1: No Deployment Without Visual Verification
**EVERY UI CHANGE MUST BE VERIFIED WITH PLAYWRIGHT**

```bash
# ❌ NEVER DO THIS
make changes → deploy directly

# ✅ ALWAYS DO THIS
make changes → npx playwright test → review screenshots → deploy
```

### Rule #2: All Tests Must Pass (10/10)
- Layout structure tests
- Component visibility tests
- Interactive functionality tests
- Responsive design tests
- Visual screenshot generation
- Platform toggle visibility
- Category dropdown interaction
- Time filter switching
- Data loading verification

## 🎨 DESIGN SYSTEM

### Color Palette
```css
/* Core Colors */
--background: #000000;      /* Pure black */
--card-bg: #1a1a1a;        /* Dark grey */
--accent: #ff6b35;         /* Orange - single accent */
--positive: #4caf50;       /* Green for gains */
--negative: #f44336;       /* Red for losses */
```

### Component Patterns
- **Cards**: Gradient background (#1a1a1a → #0f0f0f)
- **Buttons**: Orange glow on hover (0 0 15px rgba(255, 107, 53, 0.3))
- **Active States**: Solid orange gradient with black text
- **Transitions**: Always 0.3s ease

## 📋 CODE STANDARDS

### JavaScript Best Practices
```javascript
// ✅ GOOD: Named functions with clear purpose
function updateChartData(dataset, newData) {
    dataset.data.shift();
    dataset.data.push(newData);
}

// ❌ BAD: Anonymous functions with side effects
chart.data.datasets.forEach(d => {
    d.data.shift();
    d.data.push(Math.random() * 100);
});
```

### CSS Organization
```css
/* ✅ GOOD: Logical grouping */
/* Component Name */
.component {
    /* Layout */
    display: flex;
    
    /* Styling */
    background: #1a1a1a;
    
    /* Interaction */
    transition: all 0.3s ease;
}

/* ❌ BAD: Random property order */
.component {
    transition: all 0.3s;
    background: #1a1a1a;
    display: flex;
}
```

## 🧪 TESTING REQUIREMENTS

### Playwright Test Coverage
1. **Visual Tests**: Screenshots at multiple viewports
2. **Interaction Tests**: All buttons, dropdowns, hover states
3. **Data Tests**: Table content, chart rendering
4. **Responsive Tests**: Mobile, tablet, desktop

### Test File Structure
```
tests/
├── dashboard.spec.js    # All dashboard tests
└── screenshots/         # Visual artifacts
    ├── dashboard-full.png
    ├── topbar.png
    └── dashboard-content.png
```

## 🚀 DEPLOYMENT WORKFLOW

### Pre-Deployment Checklist
- [ ] Run `npx playwright test --reporter=line` - all 10 tests passing
- [ ] Review screenshots in `tests/screenshots/`
- [ ] Verify mobile responsive layout
- [ ] Check orange accent consistency  
- [ ] Confirm no console errors
- [ ] Verify Firebase data loading correctly

### Deployment Commands
```bash
# Test locally first
npx playwright test --reporter=line

# Deploy only after verification (service account method)
export GOOGLE_APPLICATION_CREDENTIALS="/workspace/frontend/ai-tracker-466821-892ecf5150a3.json" && npx firebase deploy --only hosting --project ai-tracker-466821
```

## ⚠️ COMMON PITFALLS

### 1. Skipping Visual Tests
**Impact**: Broken layouts in production
**Prevention**: ALWAYS run Playwright before deploy

### 2. Adding Multiple Colors
**Impact**: Breaks design consistency
**Prevention**: Only use orange (#ff6b35) as accent

### 3. Changing Grid Ratios Without Testing
**Impact**: Unbalanced layout on different screens
**Prevention**: Test all viewports after layout changes

### 4. Direct DOM Manipulation
**Impact**: Performance issues, memory leaks
**Prevention**: Use proper event delegation

## 📦 DEPENDENCIES

### Production (CDN)
- Chart.js v4.x - Data visualization
- Firebase SDK v9.23.0 - Database and hosting

### Development
- @playwright/test - Visual testing
- Firebase CLI - Deployment (via service account)

## 🔧 CONFIGURATION

### Firebase Setup
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**", "docs/**", "examples/**", "tests/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### Playwright Config
- Base URL: localhost:3000 (dev) or production URL
- Screenshots: always on test runs
- Browsers: Chromium minimum

## ✅ QUALITY CHECKLIST

Before any commit:
- [ ] Code follows style guide
- [ ] No magic numbers (use constants)
- [ ] Proper error handling in JavaScript
- [ ] CSS uses consistent spacing/colors
- [ ] Responsive design maintained
- [ ] Playwright tests updated if needed
- [ ] Documentation updated if needed

**Remember: Visual verification is MANDATORY - no exceptions!**

## 🚨 CRITICAL DEPLOYMENT RULES

### NEVER Trust Without Verification
1. **Deployment success ≠ Working application**
2. **Console logs ≠ User experience**
3. **Local tests ≠ Production behavior**
4. **Your screenshot ≠ User's browser**

### ALWAYS Verify With Evidence
1. Take ACTUAL production screenshots
2. Test in incognito/private browsing
3. Clear cache before testing
4. Check actual network requests
5. Verify data is loading from Firestore

### Common Failure Points
1. **Browser Caching**: Old JS/CSS cached, new code not loading
2. **Variable Initialization**: JS variables used before declaration
3. **Firebase Timing**: Firestore not ready when data fetch attempted
4. **Security Rules**: Firestore blocking reads from collections
5. **Document Names**: Case-sensitive Firebase document names ("top_this_week" not "Top This Week")
6. **Category Mapping**: Product Hunt data lacks category fields, shows generic "trending"
7. **Global Scope Issues**: dataService not available globally when event handlers need it
8. **Dynamic Event Handlers**: Event listeners on dynamically created elements need proper binding
9. **Data Structure Assumptions**: Always check actual Firebase data structure before mapping fields

### The Golden Rule
**If the user says it's not working, IT'S NOT WORKING.**
No amount of console logs or local testing overrides user experience.