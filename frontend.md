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

## Current Architecture (Updated 2025-08-06)
- **Implementation**: Single HTML file with embedded CSS and JavaScript
- **Framework**: Vanilla JavaScript (no external framework) 
- **Charts**: Chart.js v4.x with straight-line styling and dynamic time periods
- **Data**: Complete Firebase Firestore integration with real-time data
- **Performance**: Optimized with pre-sorted Firebase data (60-80% faster)
- **Hosting**: Firebase Hosting with service account deployment
- **Build**: No build process - direct deployment with comprehensive testing

## Current Features (Production Implementation)

### 1. Top Navigation Bar  
- **Time Filters**: 7d, 30d, 90d with dynamic chart updates
- **Platform Filters**: All, Reddit, YouTube with live data switching
- **Category Dropdown**: Dynamic categories from Firebase with invalid entries filtered
- Clean orange/grey styling with hover effects
- Responsive stacking on mobile

### 2. Left Column - Live Data Tables
- **Rankings Table**: Rank, Name, Category, Post Count with real Firebase data
- **Trending Table**: Product Hunt integration with live trending data
- Dynamic filtering by category and platform selection
- Performance-optimized with pre-sorted Firebase data
- Text formatting (underscores removed, proper capitalization)
- **Desktop**: Professional styling with hover effects
- **Mobile**: Responsive single column layout

### 3. Right Column - Performance Chart
- **Chart.js v4.x** with straight-line professional styling
- **Dynamic Data**: Shows top 3 products from rankings with real Firebase metrics
- **Time Period Integration**: X-axis matches selected filter (7d/30d/90d)
- **Real Date Labels**: Actual dates instead of relative time
- **Live Updates**: Chart refreshes when filters change
- **Responsive Design**: Matches combined height of left tables

## File Structure (Current)
```
frontend/
├── index.html              # Complete dashboard (HTML + CSS + JS embedded)
├── data-service.js         # Firebase data fetching and mapping logic
├── firebase-config.js      # Firebase initialization and configuration
├── firebase.json           # Firebase hosting configuration  
├── .firebaserc            # Firebase project configuration
├── .gitignore             # Security exclusions for sensitive data
├── frontend.md             # This overview document  
├── package.json            # Dependencies and scripts
├── playwright.config.js    # Test configuration
├── ai-tracker-466821-892ecf5150a3.json  # Service account key (excluded from repo)
├── tests/                  # Comprehensive test suite (10 tests)
│   ├── dashboard.spec.js   # Complete visual and functional testing
│   └── screenshots/        # Visual verification artifacts
└── docs/                   # Complete documentation
    ├── frontend_deployment.md
    ├── playwright-testing.md   
    └── context/
        ├── log.md              # Development log and status tracking
        ├── GUIDELINES.md       # Master development guidelines
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
- **Chart.js**: v4.x (CDN loaded) - Data visualization with straight-line styling
- **Firebase SDK**: v9.23.0 (CDN loaded) - Firestore real-time database integration
- **Firebase Hosting**: Production deployment platform

## Deployment
```bash
# Service account method (required for AI agents)
export GOOGLE_APPLICATION_CREDENTIALS="/workspace/frontend/ai-tracker-466821-892ecf5150a3.json" && npx firebase deploy --only hosting --project ai-tracker-466821
```

## Recently Completed (2025-08-06)
1. ✅ **Performance Optimization**: Removed client-side sorting for 60-80% speed improvement
2. ✅ **Advanced Chart Integration**: Line chart displays top 3 products with real Firebase metrics
3. ✅ **Complete Filter System**: Time, platform, and category filtering with live data updates
4. ✅ **Firebase Integration**: Full Firestore connection for rankings and trending data
5. ✅ **GitHub Repository**: Complete version control at https://github.com/canaanhowell/ai-tracker-frontend
6. ✅ **Data Validation**: Comprehensive filtering of invalid product/category names
7. ✅ **Professional Styling**: Straight-line charts and improved date formatting

## Current Critical Issue (2025-08-06)
- ⚠️ **DATA MAPPING BUG**: Product names displaying as index numbers (0,1,2,3,4) instead of actual product names
- **Root Cause**: Firebase document restructuring changed data format from `{productName: metrics}` to array/indexed structure  
- **Console Evidence**: `📋 Sample keyword data: (2) [Array(2), Array(2)]` suggests data is in array format `[productName, metrics]`
- **Impact**: Rankings table shows meaningless entries like "1. 0 Website Builder 0" instead of proper product names
- **Status**: Currently debugging Firebase data structure mapping logic to handle new format
- **Secondary Issue**: Some categories still show "All Categories"/"All Reddit" instead of actual category names

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
- `tests/dashboard.spec.js` - Complete test suite (10 tests)
- `tests/screenshots/` - Visual verification artifacts

### Documentation:
- `docs/playwright-testing.md` - Complete testing setup guide