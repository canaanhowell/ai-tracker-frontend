# AI Tools Dashboard - Ultra-Fast Static Frontend

A high-performance static site generating 153 pre-rendered pages for AI tools analytics with complete navigation, filtering, and embedded data.

## 🚀 Live Site
**https://ai-tracker-466821.web.app**

## 📊 Architecture Overview

- **Static HTML Generation**: 153 pre-built pages with embedded data (no runtime database calls)
- **Build-Time Data Integration**: Extracts data from Firebase during build process
- **Ultra-Fast Performance**: 17KB pages with inline CSS and embedded data
- **Complete Navigation**: Category, platform, and time window filtering via static routing

## 🏗️ Page Structure

- **17 Categories**: AI Chatbots, AI Coding Agents, AI Companions, etc.
- **3 Platforms**: All Platforms, Reddit, YouTube  
- **3 Time Windows**: 7d, 30d, 90d
- **Total Pages**: 17 × 3 × 3 = 153 static HTML pages

## 🛠️ Build Process

### Prerequisites
- Node.js
- Firebase Admin SDK credentials (`ai-tracker-466821-892ecf5150a3.json`)
- Firebase CLI

### Build Commands

```bash
# Generate all static pages
npm run build

# Deploy to Firebase Hosting
npm run deploy

# Build and deploy in one command
npm run build-and-deploy

# Serve locally for testing
npm run serve
```

### Build Process Details

1. **Data Extraction**: Queries Firebase `all_categories` collection
   - Rankings from `time_windows/{period}_days` documents
   - Historical data from `{period}_days_daily` collections
   - Products extracted from `keywords` arrays

2. **Static Generation**: Creates HTML files using Mustache templates
   - Embeds all data directly into HTML (no runtime queries)
   - Generates SEO metadata and structured data
   - Creates navigation URLs for all page combinations

3. **Deployment**: Uploads to Firebase Hosting with CDN distribution

## 📁 Key Files

- `build-static.js` - Main static site generator
- `templates/page-template.html` - Mustache template for all pages
- `firebase.json` - Firebase Hosting configuration
- `docs/context/` - Comprehensive documentation

## 🚨 Important Notes

**All pages are pre-generated static HTML.** Any data issues visible on the live site are build-time issues that require:

1. **Fixing source data** in Firebase collections
2. **Updating build logic** in `build-static.js` 
3. **Rebuilding and redeploying** the site

The frontend cannot fix data issues at runtime - it displays exactly what was embedded during the build process.

## 📚 Documentation

- `docs/context/FRONTEND.md` - Complete implementation plan and architecture
- `docs/context/MAPPING.md` - Firebase data structure mapping
- `docs/context/log.md` - Development log and current status
- `docs/context/playwright-testing.md` - Testing setup and procedures

## ⚡ Performance

- **Page Size**: ~17KB per page (including embedded data)
- **Load Time**: Ultra-fast (static HTML with inline CSS)
- **Global CDN**: Firebase Hosting with worldwide distribution
- **Zero Runtime Queries**: All data pre-embedded during build

## 🔄 Deployment Status

**Current**: 153 pages deployed with complete functionality
**Last Updated**: August 7, 2025
**Build System**: Manual build/deploy process
**Status**: Production ready with full navigation and filtering

### Recent Fixes Applied:
- ✅ Navigation URLs fixed for YouTube platform and 90d time window
- ✅ Category dropdown now shows all 17 categories dynamically
- ✅ 30d/90d charts corrected to show weekly/monthly data snapshots
- ✅ PH-Dashboard trending data properly mapped and displayed