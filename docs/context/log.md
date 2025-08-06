**A dynamic document for AI agents to maintain context between sessions**

Current Status (Updated 2025-08-06):
- Frontend dashboard rebuilt from scratch using minimal approach
- Live URL: https://ai-tracker-466821.web.app  
- ✅ CHART LAYOUT OPTIMIZED: Removed pie chart, line graph now fills full height
- Line graph perfectly matches combined height of both left tables
- ✅ TOPBAR IMPROVED: Removed "New" button, added "Period:" and "Platform:" labels, left-aligned
- ✅ LIVE DATA INTEGRATION: Trending table connected to Firebase "top_this_month" document with correct score mapping
- ✅ DYNAMIC CATEGORIES: Category dropdown now loads 18 categories from Firebase all_categories collection
- ✅ RANKINGS TABLE: Connected to Firebase with category filtering and "Post Count" column
- ✅ PLATFORM FILTERING: Full radio-button platform filtering (All/Reddit/YouTube) implemented
- ✅ CLEAN LOADING EXPERIENCE: Removed static data flash, professional loading states implemented
- ✅ CACHE BUSTING: Proper cache management to ensure new code loads correctly
- ✅ CLEAN ARCHITECTURE: All methods properly organized in DataService class
- ✅ TEXT FORMATTING: Names and categories now clean (remove underscores, capitalize words)
- Clean implementation with no horizontal scroll issues
- Dark theme with orange accent color implemented
- Two-tier responsive design: Desktop (>900px) / Mobile (≤900px)
- ✅ ALL 10 PLAYWRIGHT TESTS PASSING

Recently Completed (2025-08-06):
- COMPLETELY REBUILT dashboard to eliminate horizontal overflow issues
- Piece-by-piece reconstruction: topbar → table → chart
- Kept 4 columns: Rank, Name, Category, Post Count (Rankings), Score (Trending)
- Fixed responsive grid layout with proper min-widths
- Implemented Chart.js integration with live Firebase data
- Optimized table sizing: 500px left column, 450px table minimum
- Centered all table content for better alignment
- Simplified responsive breakpoint to single 900px threshold
- ✅ CHART OPTIMIZATION: Removed pie chart, resized line graph to match combined table height
- ✅ Updated Playwright tests to reflect new 4-column table structure
- ✅ Fixed all test selectors and expectations (10/10 tests passing)
- ✅ Successfully deployed with service account authentication method
- ✅ TOPBAR REFINEMENT: Removed "New" button, added "Period:" and "Platform:" labels for clarity
- ✅ Updated tests to reflect new button configuration (30d now active by default)
- ✅ LEFT-ALIGNED all filter buttons for better visual hierarchy
- ✅ FIREBASE INTEGRATION: Added Firebase SDK, config, and data service to HTML
- ✅ LIVE DATA CONNECTION: Both tables now fetch live Firebase data
- ✅ DYNAMIC CATEGORIES: Category dropdown populates from all_categories collection (18 categories)
- ✅ CATEGORY FILTERING: Rankings table filters by selected category
- ✅ PLATFORM FILTERING: Implemented full platform toggle functionality (All/Reddit/YouTube)
- ✅ TRENDING TABLE FIX: Changed data source to top_this_month, fixed score field mapping
- ✅ CLEAN LOADING: Eliminated static data flash, added professional loading states
- ✅ ARCHITECTURE CLEANUP: Resolved technical debt with proper cache busting and clean DataService class
- ✅ TEXT CLEANING: cleanText() function removes underscores and capitalizes words
- ✅ DATA SERVICE: Multiple methods for different data sources (PH, categories, combined data)

⚠️ CRITICAL LESSONS LEARNED:
- Browser caching can completely prevent seeing code changes
- Always verify deployment is actually showing new code
- Build piece-by-piece when debugging complex layout issues
- Minimal approach works better than trying to fix everything at once
- User's browser experience is the ONLY truth - screenshots don't always match reality
- **Firebase document names are case-sensitive** - "Top This Week" ≠ "top_this_week"
- Always check actual collection/document names before assuming format

Current Architecture:
- Static HTML with embedded CSS and JavaScript
- Chart.js loaded via CDN for data visualization
- ✅ Firebase Firestore integration for live data
- Firebase SDK v9.23.0 loaded via CDN
- Responsive grid: desktop 1fr 2fr layout, mobile single column
- Live data: Trending table → PH-dashboard "top_this_month" document with correct score field mapping ✅ WORKING
- Live data: Rankings table → all_categories collection with category filtering ✅ WORKING
- Platform filtering: All/Reddit/YouTube radio-button filtering with live data switching ✅ WORKING
- Dynamic categories: 18 categories loaded from Firebase all_categories collection ✅ WORKING

⚠️ MANDATORY WORKFLOW:
1. Make UI changes
2. Run: `npx playwright test --reporter=line` 
3. Verify 10/10 tests pass
4. Review screenshots in `tests/screenshots/`
5. Only deploy if visual verification passes
6. NEVER skip visual testing for UI changes

Current Implementation:
- index.html - Single file with embedded CSS/JS and Firebase integration
- Chart.js v4.x - Loaded via CDN
- Firebase SDK v9.23.0 - Loaded via CDN for live data
- firebase-config.js - Firebase initialization
- data-service.js - Firestore data fetching
- firebase.json - Hosting configuration  
- ✅ LIVE DATA: Both tables show real Firebase data with dynamic filtering
- ✅ TEXT FORMATTING: All names/categories cleaned (underscores removed, proper capitalization)
- Minimal responsive design - 900px breakpoint only

File Structure (Current):
- index.html (contains embedded CSS/JS + Firebase scripts)
- firebase-config.js (Firebase initialization)
- data-service.js (Firestore data service)
- firebase.json (hosting config)
- .firebaserc (project config)
- ai-tracker-466821-892ecf5150a3.json (service account)
- Deployment: Service account method only (see deployment guide)

