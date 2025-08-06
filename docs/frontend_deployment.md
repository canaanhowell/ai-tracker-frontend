# Frontend Dashboard Deployment Guide

## Overview
This document outlines the complete process for creating and deploying the AI Tracker Dashboard to Firebase Hosting.

## Live Dashboard
🌐 **Production URL**: https://ai-tracker-466821.web.app

## Current Architecture
- **Framework**: Vanilla JavaScript (no framework)
- **Styling**: Pure CSS with dark theme and orange accent
- **Data**: Firebase Firestore integration
- **Hosting**: Firebase Hosting
- **Charts**: Chart.js (CDN)
- **Testing**: Playwright for visual verification

## Project Structure
```
frontend/
├── index.html              # Main dashboard HTML (with embedded CSS/JS)
├── firebase-config.js      # Firebase initialization
├── data-service.js        # Firestore data fetching logic
├── firebase.json           # Firebase hosting config
├── .firebaserc            # Firebase project config
├── ai-tracker-466821-892ecf5150a3.json  # Service account key
├── playwright.config.js   # Test configuration
├── package.json           # Dependencies and scripts
└── tests/
    ├── dashboard.spec.js  # Visual tests (10 tests)
    └── screenshots/       # Visual verification
```

## Setup Process

### 1. Initialize Project
```bash
cd /workspace/frontend
npm init -y
```

### 2. Install Dependencies
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 3. Configure Firebase Hosting
Create `firebase.json`:
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**", "docs/**", "examples/**", "tests/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

Create `.firebaserc`:
```json
{
  "projects": {
    "default": "ai-tracker-466821"
  }
}
```

## Design System

### Dark Theme with Orange Accent
The dashboard features a dark theme with orange glow effects:

```css
:root {
  --background: #000000;
  --card-bg: #1a1a1a;
  --accent: #ff6b35;
  --text-primary: #ffffff;
  --text-secondary: #999999;
}
```

### Key Visual Features
- **Orange glow** on active buttons and hover states
- **Gradient backgrounds** on cards (#1a1a1a to #0f0f0f)
- **Custom orange scrollbar**
- **Smooth 0.3s transitions** throughout
- **Deep shadows** for depth (0 10px 30px rgba(0,0,0,0.5))

## Recent Updates (2025-08-06)

### Chart Layout Optimization
- ✅ **Removed pie chart** from right column (was taking unnecessary space)
- ✅ **Expanded line graph** to fill the entire right column height
- ✅ **Perfect height matching** - line graph now exactly matches combined height of both left tables
- ✅ **Updated Playwright tests** to reflect new layout (10/10 passing)
- ✅ **Deployment method clarified** for future AI agents (service account only)

## Current Implementation

### Components

#### 1. Top Navigation Bar
- **Time Filters**: "Period:" label, "30d" (active), "90d" buttons 
- **Platform Toggles**: "Platform:" label, All, Reddit, YouTube buttons (visible always)
- **Category Dropdown**: All Categories + 18 dynamic categories from Firebase
- **Left-aligned layout** for better visual hierarchy
- **Responsive**: Stacks vertically on mobile

#### 2. Tables (Left Column)
- **Rankings Table**: Rank, Name, Category, Post Count (live Firebase data with category filtering)
- **Trending Table**: Rank, Name, Category, Score (live Product Hunt data)
- **Live Data Sources**: Rankings → all_categories collection, Trending → PH-dashboard "top_this_month"
- **Text Formatting**: Names and categories cleaned (underscores removed, proper capitalization)
- **Interactive Filtering**: Rankings table updates when category is selected
- **Platform Filtering**: Full radio-button functionality (All/Reddit/YouTube) with live data switching
- **Data Refresh**: On page load, category selection, and platform selection via Firebase integration

#### 3. Performance Chart (Right Column)
- **Chart.js** line chart (pie chart removed)
- **Static sample data**: 3 datasets with trend lines
- **Perfect height matching**: Matches combined height of both left tables
- **Interactive Legend**: Manual legend display (top of chart)
- **Sample data only**: No real-time updates yet

### Layout
- **Grid System**: 1fr 2fr (left:right ratio)
- **Responsive**: Single column on tablets/mobile
- **Max Width**: 1600px centered

## Build and Deployment

### ⚠️ MANDATORY PLAYWRIGHT VISUAL TESTING

**CRITICAL: Never deploy without visual verification using Playwright**

Before any deployment, you MUST:

1. **Install system dependencies** (one-time setup):
```bash
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libcairo2 libpango-1.0-0 libasound2
```

2. **Run Playwright tests** against production:
```bash
npx playwright test --reporter=line
```

3. **Review screenshots** in `tests/screenshots/`:
   - `dashboard-full.png` - Complete layout verification
   - `topbar.png` - Navigation bar verification  
   - `dashboard-content.png` - Main content verification

4. **Verify all tests pass** (10/10 passing required)

### Build for Production
No build step required - this is a vanilla JavaScript application. All files are served directly.

### Deploy to Firebase Hosting

#### 🚨 FOR AI AGENTS: USE ONLY THE SERVICE ACCOUNT METHOD 🚨

**NEVER use `firebase login` - it won't work in this environment.**

#### ⚠️ MANDATORY DEPLOYMENT PROCESS FOR AI AGENTS

**Step 1: Always test first (REQUIRED)**
```bash
cd /workspace/frontend
npx playwright test --reporter=line
```
- Must show "10 passed" 
- If any tests fail, fix issues before proceeding

**Step 2: Deploy using service account (ONLY method that works)**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/workspace/frontend/ai-tracker-466821-892ecf5150a3.json" && npx firebase deploy --only hosting --project ai-tracker-466821
```

**Why this specific command:**
- Service account file already exists at that path
- Avoids authentication prompts that fail in containers
- Uses single-line command to prevent environment variable issues

**Step 3: Verify deployment**
```bash
npx playwright test --grep "should take visual screenshot" --reporter=line
```

#### Expected Successful Deployment Output
```
=== Deploying to 'ai-tracker-466821'...
✔  hosting[ai-tracker-466821]: file upload complete
✔  hosting[ai-tracker-466821]: version finalized
✔  hosting[ai-tracker-466821]: release complete
✔  Deploy complete!
Hosting URL: https://ai-tracker-466821.web.app
```

#### ❌ DO NOT USE - Will Fail in Container Environment
```bash
firebase login              # FAILS - no interactive terminal
firebase deploy --only hosting  # FAILS - needs authentication
```

#### 🔧 Troubleshooting Deployment Issues

**Error: "Failed to authenticate"**
- You tried `firebase login` (wrong method)
- Use the service account command above instead

**Error: "Permission denied"**
- Service account file missing or wrong path
- Verify file exists: `ls -la /workspace/frontend/ai-tracker-466821-892ecf5150a3.json`

**Error: "Project not found"**
- Missing `--project ai-tracker-466821` flag
- Always include the project ID in the command

### Deployment Output
```
✔  hosting[ai-tracker-466821]: file upload complete
✔  hosting[ai-tracker-466821]: version finalized
✔  hosting[ai-tracker-466821]: release complete

Hosting URL: https://ai-tracker-466821.web.app
```

## Environment Variables
The dashboard uses Firebase credentials embedded in `firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCJNad4bjOyrEq0xGjhR1bpVZLt8sPWwHE",
    authDomain: "ai-tracker-466821.firebaseapp.com",
    projectId: "ai-tracker-466821",
    // ... other config
};
```

## Performance Optimizations
- Single HTML file reduces network requests
- CDN delivery for Firebase SDK and Chart.js
- Minimal CSS/JS embedded directly
- Efficient Firestore queries with proper document targeting

## Troubleshooting

### Firebase Authentication Issues
- Ensure service account JSON file exists: `/workspace/frontend/ai-tracker-466821-892ecf5150a3.json`
- Use service account deployment method only
- Never use `firebase login` in container environments

### Data Loading Issues
- Check document name: `"top_this_month"` (case-sensitive, with underscores)
- Verify Firebase console logs in browser developer tools
- Ensure Firestore security rules allow reads
- Cache busting: Use versioned script tags (e.g., `data-service.js?v=20250806-clean`)

### Deployment Issues
- Use exact command with environment variable
- Verify all 10 Playwright tests pass before deployment
- Check browser cache if changes don't appear

## Current Limitations & Future Enhancements
- **Product Hunt Category Mapping**: Product Hunt data lacks category info - currently shows generic "trending"
- **Chart Data**: Static sample data - needs integration with live trending data
- **Time Filters**: Time filter buttons exist but filtering logic not yet implemented
- **Performance Optimization**: Could benefit from Redis caching or browser storage caching

## Future Development Priorities
1. Fix category mapping for Product Hunt trending data (derive from product names/types)
2. Connect performance chart to live trending data
3. Implement time filter functionality (30d/90d)
4. Add performance caching (Redis backend or browser storage)
5. Add real-time data refresh capabilities
6. YouTube data field mapping optimization

## Resources
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Playwright Testing](https://playwright.dev/)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)