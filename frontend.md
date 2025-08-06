# Frontend Dashboard Overview

## Project Description
A minimalistic dark-themed dashboard rebuilt from scratch with a focus on eliminating horizontal scroll issues and providing clean data visualization.

## Live URL
🌐 **Production**: https://ai-tracker-466821.web.app

## Design Specifications
- **Theme**: Dark mode with black background (#000000)
- **Cards**: Dark grey (#1a1a1a) with subtle gradients
- **Accent Color**: Orange (#ff6b35) - single accent color throughout
- **Layout**: Two-column (1fr:2fr ratio) responsive grid
- **Typography**: System fonts with compact, readable sizing

## Current Architecture (Rebuilt 2025-08-06)
- **Implementation**: Single HTML file with embedded CSS and JavaScript
- **Framework**: Vanilla JavaScript (no external framework)
- **Charts**: Chart.js v4.x loaded via CDN
- **Data**: Static test data (Firebase integration planned)
- **Hosting**: Firebase Hosting
- **Build**: No build process - direct deployment

## Current Features (Minimal Implementation)

### 1. Top Navigation Bar  
- Time filter buttons: "New" (active), "30d", "90d"
- Clean orange/grey styling
- Responsive stacking on mobile

### 2. Left Column - Ranking Table (4 columns)
- **Columns**: Rank, Name, Category, Post Count  
- Static test data (3 sample rows)
- Centered content alignment
- Responsive text scaling
- **Desktop min-width**: 450px table in 500px column
- **Mobile**: Single column layout at ≤900px

### 3. Right Column - Performance Chart
- Chart.js line chart with sample data
- Two demo datasets with different colors
- Responsive canvas sizing  
- Dark theme integration
- **Desktop**: 300px height
- **Mobile**: 250px height

## File Structure (Simplified)
```
frontend/
├── index.html              # Complete dashboard (HTML + CSS + JS embedded)
├── firebase.json           # Firebase hosting configuration  
├── .firebaserc            # Firebase project configuration
├── frontend.md             # This overview document
├── requirements.txt        # Dependencies list
├── index-backup.html       # Backup of old complex version
└── docs/                   # Documentation
    ├── frontend_deployment.md
    ├── playwright-testing.md   
    └── context/
        ├── log.md              # Updated development log
        └── frontend-guidelines.md
```

## Styling Highlights
- **Gradients**: Subtle linear gradients on cards and buttons
- **Glow Effects**: Orange glow on hover and active states
- **Transitions**: Smooth 0.3s transitions throughout
- **Shadows**: Deep shadows for depth perception
- **Scrollbar**: Custom styled with orange accent

## Interactive Elements
1. **Filter Buttons**: Click to activate different data views
2. **Legend Items**: Click to show/hide chart lines
3. **Table Rows**: Hover for highlighting and scale effects
4. **Chart**: Hover for detailed tooltips

## Responsive Design (Simplified)
- **Desktop** (>900px): Two-column grid layout (1fr:2fr ratio)
- **Mobile** (≤900px): Single column stack with optimized spacing
- **No tablet breakpoint**: Clean transition from desktop to mobile

## Performance Features
- Lightweight vanilla JS (no framework overhead)
- Efficient Chart.js rendering
- Debounced interactions
- Minimal DOM manipulation

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox layout
- Custom CSS properties

## External Dependencies
- **Chart.js**: v4.x (CDN loaded)
- **Firebase Hosting**: For deployment

## Deployment
```bash
npx firebase deploy --only hosting --project ai-tracker-466821
```

## Next Development Steps
1. **Add platform buttons**: Reddit/YouTube toggles to topbar
2. **Add category dropdown**: Full category selection
3. **Firebase integration**: Connect to Firestore for live data
4. **Interactive functionality**: Make filters actually work
5. **Testing**: Ensure no horizontal scroll issues

## Key Lessons from Rebuild
- **Piece-by-piece approach**: Build incrementally to identify issues
- **Minimal first**: Start simple, add complexity gradually  
- **User experience trumps code**: What user sees is the only truth
- **Test deployments**: Browser cache can hide real issues

## ⚠️ MANDATORY TESTING REQUIREMENTS

### Pre-Deployment Visual Testing
**CRITICAL: All UI changes MUST be visually verified with Playwright before deployment**

#### Required Test Suite
```bash
# Install dependencies (one-time)
npm install --save-dev @playwright/test
sudo apt-get install -y [browser dependencies]

# Run mandatory tests
npx playwright test --reporter=line
```

#### Test Coverage Required:
1. **Layout Structure** - Two-column grid, proper ratios
2. **Top Bar Components** - Time filters (7d/30d/90d) + category dropdown
3. **Data Display** - Ranking table, chart with legend
4. **Interactive Elements** - Button states, dropdown functionality
5. **Responsive Design** - Mobile viewport testing
6. **Visual Screenshots** - Full dashboard, topbar, content verification

#### Failure Criteria:
- Any test failing = NO DEPLOYMENT
- Missing screenshots = NO DEPLOYMENT  
- Layout broken on mobile = NO DEPLOYMENT
- Color scheme deviation = NO DEPLOYMENT

### Testing Files:
- `playwright.config.js` - Test configuration
- `tests/dashboard.spec.js` - Complete test suite (8 tests)
- `tests/screenshots/` - Visual verification artifacts

### Documentation:
- `docs/playwright-testing.md` - Complete testing setup guide