#!/usr/bin/env node

/**
 * Ultra-Fast Static Site Generator for AI Tools Dashboard
 * Generates pre-rendered static HTML pages with embedded data
 * 
 * Development Mode: 8 test pages (2x2x2)
 * Production Mode: 162 full pages (18x3x3)
 */

const admin = require('firebase-admin');
const fs = require('fs-extra');
const path = require('path');
const mustache = require('mustache');

// Configuration
const CONFIG = {
    // Production mode - full 162-page generation
    TEST_MODE: false,
    
    // Firebase configuration
    FIREBASE_PROJECT_ID: 'ai-tracker-466821',
    FIREBASE_SERVICE_ACCOUNT: './ai-tracker-466821-892ecf5150a3.json',
    
    // Build configuration
    OUTPUT_DIR: './public',
    TEMPLATE_FILE: './templates/page-template.html',
    CONCURRENT_BUILDS: 4, // Reduced for testing
    
    // Test sample configuration (when TEST_MODE = true)
    TEST_CATEGORIES: ['all_categories', 'ai_chatbots'],
    TEST_PLATFORMS: ['all', 'reddit'],
    TEST_TIME_WINDOWS: ['30', '7'],
    
    // Full production configuration (when TEST_MODE = false)
    FULL_CATEGORIES: [
        'all_categories', 'ai_chatbots', 'ai_coding_agents', 'ai_companions', 
        'ai_media_generation', 'ai_models', 'automation', 'devices', 
        'general_ai', 'health_and_fitness', 'marketing', 'productivity', 
        'robots', 'social_media', 'website_builder', 'ai_research', 'fintech'
    ],
    FULL_PLATFORMS: ['all', 'reddit', 'youtube'],
    FULL_TIME_WINDOWS: ['7', '30', '90']
};

class StaticSiteGenerator {
    constructor() {
        this.db = null;
        this.cache = new Map();
        this.buildStats = {
            startTime: Date.now(),
            pagesGenerated: 0,
            errors: 0,
            cacheHits: 0
        };
        
        console.log(`🚀 Static Site Generator initialized`);
        console.log(`📋 Mode: ${CONFIG.TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
        
        if (CONFIG.TEST_MODE) {
            const testPages = CONFIG.TEST_CATEGORIES.length * CONFIG.TEST_PLATFORMS.length * CONFIG.TEST_TIME_WINDOWS.length;
            console.log(`🧪 Test sample: ${testPages} pages`);
            console.log(`📂 Categories: ${CONFIG.TEST_CATEGORIES.join(', ')}`);
            console.log(`🔗 Platforms: ${CONFIG.TEST_PLATFORMS.join(', ')}`);
            console.log(`⏰ Time windows: ${CONFIG.TEST_TIME_WINDOWS.join(', ')}d`);
        }
    }

    /**
     * Initialize Firebase Admin SDK
     */
    async initializeFirebase() {
        try {
            // Try service account file first
            if (await fs.pathExists(CONFIG.FIREBASE_SERVICE_ACCOUNT)) {
                console.log('🔑 Using service account file...');
                admin.initializeApp({
                    credential: admin.credential.cert(CONFIG.FIREBASE_SERVICE_ACCOUNT),
                    projectId: CONFIG.FIREBASE_PROJECT_ID
                });
            } else {
                console.log('🔑 Using project ID only (read-only access)...');
                admin.initializeApp({
                    projectId: CONFIG.FIREBASE_PROJECT_ID
                });
            }
            
            this.db = admin.firestore();
            console.log('✅ Firebase initialized successfully');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate URL path for a page combination
     */
    generateUrlPath(category, platform, timeWindow) {
        const parts = [];
        
        // Category path
        if (category !== 'all_categories') {
            parts.push('category', category);
        }
        
        // Platform path (only if not 'all')
        if (platform !== 'all') {
            parts.push(platform);
        }
        
        // Time window path (only if not default 30d)
        if (timeWindow !== '30') {
            parts.push(timeWindow + 'd');
        }
        
        // Return root path or constructed path
        return parts.length === 0 ? '/' : '/' + parts.join('/') + '/';
    }

    /**
     * Generate file path for a page combination
     */
    generateFilePath(category, platform, timeWindow) {
        const urlPath = this.generateUrlPath(category, platform, timeWindow);
        
        if (urlPath === '/') {
            return path.join(CONFIG.OUTPUT_DIR, 'index.html');
        } else {
            return path.join(CONFIG.OUTPUT_DIR, urlPath.slice(1, -1), 'index.html');
        }
    }

    /**
     * Fetch data for a specific page combination
     */
    async fetchPageData(category, platform, timeWindow) {
        const cacheKey = `${category}-${platform}-${timeWindow}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            this.buildStats.cacheHits++;
            return this.cache.get(cacheKey);
        }
        
        console.log(`📊 Fetching data for ${category}/${platform}/${timeWindow}d...`);
        
        try {
            const pageData = {
                category,
                platform,
                timeWindow,
                rankings: [],
                trending: [],
                performance: []
            };
            
            // Fetch rankings data
            pageData.rankings = await this.fetchRankingsData(category, platform, timeWindow);
            
            // Fetch trending data (static across all pages)
            pageData.trending = await this.fetchTrendingData();
            
            // Generate performance chart data with REAL current values embedded
            pageData.performance = await this.generatePerformanceData(pageData.rankings.slice(0, 3), timeWindow, category, platform);
            
            // Cache the data
            this.cache.set(cacheKey, pageData);
            
            console.log(`✅ Data fetched for ${category}/${platform}/${timeWindow}d - ${pageData.rankings.length} rankings`);
            return pageData;
            
        } catch (error) {
            console.error(`❌ Error fetching data for ${cacheKey}:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch rankings data from time_windows (aggregated totals for the period)
     */
    async fetchRankingsData(category, platform, timeWindow) {
        try {
            const collectionPath = 'all_categories';
            const docId = category === 'all_categories' ? 'all_categories' : category;
            const timeWindowDoc = `${timeWindow}_days`;
            
            // Get aggregated data from time_windows subcollection
            const snapshot = await this.db
                .collection(collectionPath)
                .doc(docId)
                .collection('time_windows')
                .doc(timeWindowDoc)
                .get();
            
            if (!snapshot.exists) {
                console.warn(`⚠️ Time window ${collectionPath}/${docId}/time_windows/${timeWindowDoc} not found`);
                return [];
            }
            
            const data = snapshot.data();
            
            return this.extractAndRankProducts(data, platform);
            
        } catch (error) {
            console.error(`❌ Error fetching rankings for ${category}:`, error.message);
            return [];
        }
    }

    /**
     * Fetch trending data from Product Hunt
     */
    async fetchTrendingData() {
        try {
            const doc = await this.db.collection('PH-dashboard').doc('top_this_month').get();
            
            if (!doc.exists) {
                console.warn('⚠️ PH trending data not found');
                return [];
            }
            
            const data = doc.data();
            const products = [];
            
            // CORRECT: Use data.products array (as documented in mapping.md)
            if (data.products && Array.isArray(data.products)) {
                data.products.forEach((product, index) => {
                    if (product && typeof product === 'object') {
                        products.push({
                            rank: index + 1,
                            name: this.cleanText(product.product_name || 'Unknown'), // CORRECT field
                            category: this.cleanText(product.category || 'AI Tools'),
                            score: product.score || 0 // Primary score field
                        });
                    }
                });
            }
            
            console.log(`✅ Found ${products.length} trending products from PH-dashboard`);
            return products.slice(0, 5);
            
        } catch (error) {
            console.warn(`⚠️ Error fetching trending data: ${error.message}`);
            return [];
        }
    }

    /**
     * Extract and rank products from Firebase data
     * FIXED: keywords is an ARRAY, not an object with string keys
     */
    extractAndRankProducts(data, platform) {
        const products = [];
        
        // CORRECT: keywords is an ARRAY, already ranked by combined_score
        if (data.keywords && Array.isArray(data.keywords)) {
            data.keywords.forEach((product, index) => {
                if (product && typeof product === 'object') {
                    let score = 0;
                    
                    switch (platform) {
                        case 'reddit':
                            score = product.reddit_post_count || 0;
                            break;
                        case 'youtube':
                            score = product.youtube_video_count || 0;
                            break;
                        case 'all':
                        default:
                            score = product.combined_score || 0;
                            break;
                    }
                    
                    if (score > 0) {
                        products.push({
                            rank: index + 1, // Already ranked in Firebase
                            name: this.cleanText(product.keyword || 'Unknown'), // Use 'keyword', not 'name'
                            category: this.cleanText('AI Tools'), // Category is determined by collection
                            score: score,
                            velocity: product.velocity || 0,
                            acceleration: product.acceleration || 0
                        });
                    }
                }
            });
        }
        
        // No need to sort - already ranked by combined_score in Firebase
        return products.slice(0, 5); // Top 5
    }

    /**
     * Generate performance chart data from REAL daily historical Firebase data
     */
    async generatePerformanceData(topProducts, timeWindow, category, platform) {
        const performance = {
            labels: this.generateTimeLabels(timeWindow),
            datasets: []
        };
        
        for (let i = 0; i < topProducts.length; i++) {
            const product = topProducts[i];
            // Fetch REAL daily historical data for this product
            const dailyData = await this.fetchRealDailyData(product.name, timeWindow, category, platform);
            
            performance.datasets.push({
                label: product.name,
                data: dailyData,
                color: ['#ff6b35', '#ff8f65', '#ffb399'][i] || '#ccc'
            });
        }
        
        return performance;
    }
    
    /**
     * Fetch REAL daily historical data from Firebase subcollections
     * FIXED: keywords is an ARRAY, not an object with numeric keys
     */
    async fetchRealDailyData(productName, timeWindow, category, platform) {
        try {
            const collectionPath = 'all_categories';
            const docId = category === 'all_categories' ? 'all_categories' : category;
            const subcollection = `${timeWindow}_days_daily`;
            const numPoints = timeWindow === '7' ? 7 : 6;
            
            // For 30d and 90d, we need to fetch weekly snapshots, not consecutive days
            let snapshot;
            if (timeWindow === '7') {
                // For 7d, get last 7 consecutive days
                snapshot = await this.db
                    .collection(collectionPath)
                    .doc(docId)
                    .collection(subcollection)
                    .orderBy('date', 'desc')
                    .limit(numPoints)
                    .get();
            } else {
                // For 30d and 90d, get weekly snapshots
                const dates = this.getWeeklyDates(timeWindow);
                const docs = [];
                
                // For each target date, try to get that date or the closest available date
                for (const targetDate of dates) {
                    let doc = await this.db
                        .collection(collectionPath)
                        .doc(docId)
                        .collection(subcollection)
                        .doc(targetDate)
                        .get();
                    
                    // If target date doesn't exist, try previous days (up to 3 days back)
                    if (!doc.exists) {
                        for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
                            const altDate = new Date(targetDate);
                            altDate.setDate(altDate.getDate() - dayOffset);
                            const altDateStr = altDate.toISOString().split('T')[0];
                            
                            doc = await this.db
                                .collection(collectionPath)
                                .doc(docId)
                                .collection(subcollection)
                                .doc(altDateStr)
                                .get();
                            
                            if (doc.exists) {
                                console.log(`📅 Using ${altDateStr} instead of ${targetDate}`);
                                break;
                            }
                        }
                    }
                    
                    if (doc.exists) {
                        docs.push(doc);
                    }
                }
                
                snapshot = {
                    empty: docs.length === 0,
                    docs: docs.reverse() // Oldest to newest
                };
            }
            
            if (snapshot.empty) {
                console.warn(`⚠️ No daily data found for ${productName}`);
                return Array(numPoints).fill(0);
            }
            
            // Build time series from daily documents
            const dailyValues = [];
            const docs = snapshot.docs.reverse(); // Oldest to newest for chart
            
            for (const doc of docs) {
                const data = doc.data();
                let value = 0;
                
                // CORRECT: keywords is an ARRAY, need to find product by keyword field
                if (data.keywords && Array.isArray(data.keywords)) {
                    const product = data.keywords.find(k => 
                        k.keyword && k.keyword.toLowerCase() === productName.toLowerCase()
                    );
                    
                    if (product) {
                        // Get platform-specific daily count
                        if (platform === 'reddit') {
                            value = product.reddit_post_count || 0;
                        } else if (platform === 'youtube') {
                            value = product.youtube_video_count || 0;
                        } else {
                            value = product.combined_score || 0;
                        }
                    }
                }
                
                dailyValues.push(value);
            }
            
            // Pad with zeros if we don't have enough data points
            while (dailyValues.length < numPoints) {
                dailyValues.unshift(0);
            }
            
            return dailyValues.slice(0, numPoints);
            
        } catch (error) {
            console.warn(`⚠️ Error fetching daily data for ${productName}:`, error.message);
            const numPoints = timeWindow === '7' ? 7 : 6;
            return Array(numPoints).fill(0);
        }
    }

    /**
     * Get weekly date strings for fetching data
     */
    getWeeklyDates(timeWindow) {
        const dates = [];
        const now = new Date();
        const intervals = 6;
        
        for (let i = 0; i < intervals; i++) {
            const date = new Date(now);
            if (timeWindow === '30') {
                // Weekly intervals for 30d
                date.setDate(date.getDate() - (i * 7));
            } else {
                // Monthly intervals for 90d
                date.setMonth(date.getMonth() - i);
            }
            // Format as YYYY-MM-DD
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr);
        }
        
        return dates.reverse(); // Oldest to newest
    }
    
    /**
     * Generate time labels for charts
     */
    generateTimeLabels(timeWindow) {
        const labels = [];
        const now = new Date();
        const days = parseInt(timeWindow);
        const intervals = days === 7 ? 7 : 6;
        
        for (let i = intervals - 1; i >= 0; i--) {
            const date = new Date(now);
            if (days === 7) {
                date.setDate(date.getDate() - i);
            } else if (days === 30) {
                date.setDate(date.getDate() - (i * 7));
            } else {
                date.setMonth(date.getMonth() - i);
            }
            
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();
            labels.push(`${monthName} ${day}`);
        }
        
        return labels;
    }


    /**
     * Clean text utility
     */
    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Generate SEO metadata for a page
     */
    generateSEOData(category, platform, timeWindow, data) {
        const categoryDisplay = category === 'all_categories' ? 'All Categories' : this.cleanText(category);
        const platformDisplay = platform === 'all' ? 'All Platforms' : this.cleanText(platform);
        const timeDisplay = `${timeWindow} Days`;
        
        const title = `Best AI Tools - ${categoryDisplay} (${platformDisplay}, ${timeDisplay}) | AI Tools Dashboard`;
        const description = `Top AI tools rankings for ${categoryDisplay} based on ${platformDisplay} data over ${timeDisplay}. Real-time analytics and performance insights.`;
        
        return {
            title,
            description,
            canonical: this.generateUrlPath(category, platform, timeWindow),
            structured_data: {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": title,
                "description": description,
                "numberOfItems": data.rankings.length,
                "itemListElement": data.rankings.slice(0, 3).map((item, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": item.name,
                    "description": `${item.category} tool with ${item.score} points`
                }))
            }
        };
    }

    /**
     * Generate a single static page
     */
    async generatePage(category, platform, timeWindow) {
        try {
            console.log(`📄 Generating page: ${category}/${platform}/${timeWindow}d`);
            
            // Fetch data
            const data = await this.fetchPageData(category, platform, timeWindow);
            
            // Generate SEO data
            const seo = this.generateSEOData(category, platform, timeWindow, data);
            
            // Prepare template data
            const templateData = {
                // Page identification
                category,
                platform,
                timeWindow,
                categoryDisplay: category === 'all_categories' ? 'All Categories' : this.cleanText(category),
                platformDisplay: platform === 'all' ? 'All Platforms' : this.cleanText(platform),
                
                // SEO data
                title: seo.title,
                description: seo.description,
                canonical: seo.canonical,
                structured_data: JSON.stringify(seo.structured_data),
                
                // Page data
                rankings: data.rankings,
                trending: data.trending,
                performance: JSON.stringify(data.performance),
                
                // Active states for UI (boolean helpers)
                timeWindow7: timeWindow === '7',
                timeWindow30: timeWindow === '30',
                timeWindow90: timeWindow === '90',
                platformAll: platform === 'all',
                platformReddit: platform === 'reddit',
                platformYoutube: platform === 'youtube',
                categoryActive: category !== 'all_categories',
                
                // Path helpers for navigation
                categoryPath: category !== 'all_categories' ? category : null,
                platformPath: platform !== 'all' ? platform : null,
                
                // Navigation URLs for all platforms and time windows
                urls: {
                    // Platform URLs
                    allPlatform: category === 'all_categories' ? 
                        (timeWindow === '30' ? '/' : `/${timeWindow}d/`) :
                        `/category/${category}/${timeWindow === '30' ? '' : timeWindow + 'd/'}`,
                    redditPlatform: category === 'all_categories' ?
                        `/reddit/${timeWindow === '30' ? '' : timeWindow + 'd/'}` :
                        `/category/${category}/reddit/${timeWindow === '30' ? '' : timeWindow + 'd/'}`,
                    youtubePlatform: category === 'all_categories' ?
                        `/youtube/${timeWindow === '30' ? '' : timeWindow + 'd/'}` :
                        `/category/${category}/youtube/${timeWindow === '30' ? '' : timeWindow + 'd/'}`,
                    
                    // Time window URLs
                    time7d: category === 'all_categories' ?
                        (platform === 'all' ? '/7d/' : `/${platform}/7d/`) :
                        `/category/${category}/${platform === 'all' ? '' : platform + '/'}7d/`,
                    time30d: category === 'all_categories' ?
                        (platform === 'all' ? '/' : `/${platform}/`) :
                        `/category/${category}/${platform === 'all' ? '' : platform + '/'}`,
                    time90d: category === 'all_categories' ?
                        (platform === 'all' ? '/90d/' : `/${platform}/90d/`) :
                        `/category/${category}/${platform === 'all' ? '' : platform + '/'}90d/`,
                    
                    // Category URLs - generate for all categories
                    allCategories: platform === 'all' ?
                        (timeWindow === '30' ? '/' : `/${timeWindow}d/`) :
                        `/${platform}/${timeWindow === '30' ? '' : timeWindow + 'd/'}`
                },
                
                // Generate category URLs dynamically
                categoryUrls: {},
                
                // Utility
                currentDate: new Date().toISOString().split('T')[0]
            };
            
            // Generate URLs for all categories
            const allCategories = CONFIG.TEST_MODE ? CONFIG.TEST_CATEGORIES : CONFIG.FULL_CATEGORIES;
            allCategories.forEach(cat => {
                const catKey = cat === 'all_categories' ? 'allCategories' : cat.replace(/_/g, '');
                templateData.categoryUrls[catKey] = cat === 'all_categories' ?
                    (platform === 'all' ? 
                        (timeWindow === '30' ? '/' : `/${timeWindow}d/`) :
                        `/${platform}/${timeWindow === '30' ? '' : timeWindow + 'd/'}`) :
                    (platform === 'all' ?
                        `/category/${cat}/${timeWindow === '30' ? '' : timeWindow + 'd/'}` :
                        `/category/${cat}/${platform}/${timeWindow === '30' ? '' : timeWindow + 'd/'}`);
            });
            
            // Also add the category list for dropdown
            templateData.allCategoryList = allCategories.map(cat => ({
                name: cat === 'all_categories' ? 'All Categories' : this.cleanText(cat),
                url: templateData.categoryUrls[cat === 'all_categories' ? 'allCategories' : cat.replace(/_/g, '')],
                active: cat === category
            }));
            
            // Load and render template
            const template = await fs.readFile('./templates/page-template.html', 'utf8');
            const html = mustache.render(template, templateData);
            
            // Determine output path
            const filePath = this.generateFilePath(category, platform, timeWindow);
            
            // Ensure directory exists
            await fs.ensureDir(path.dirname(filePath));
            
            // Write file
            await fs.writeFile(filePath, html, 'utf8');
            
            this.buildStats.pagesGenerated++;
            console.log(`✅ Generated: ${filePath}`);
            
            return filePath;
            
        } catch (error) {
            this.buildStats.errors++;
            console.error(`❌ Error generating page ${category}/${platform}/${timeWindow}d:`, error.message);
            throw error;
        }
    }

    /**
     * Generate all pages based on current mode
     */
    async generateAllPages() {
        console.log(`\n🏗️ Starting static site generation...`);
        
        // Determine which configuration to use
        const categories = CONFIG.TEST_MODE ? CONFIG.TEST_CATEGORIES : CONFIG.FULL_CATEGORIES;
        const platforms = CONFIG.TEST_MODE ? CONFIG.TEST_PLATFORMS : CONFIG.FULL_PLATFORMS;
        const timeWindows = CONFIG.TEST_MODE ? CONFIG.TEST_TIME_WINDOWS : CONFIG.FULL_TIME_WINDOWS;
        
        const totalPages = categories.length * platforms.length * timeWindows.length;
        console.log(`📊 Generating ${totalPages} pages...`);
        
        // Generate all combinations
        const pageJobs = [];
        for (const category of categories) {
            for (const platform of platforms) {
                for (const timeWindow of timeWindows) {
                    pageJobs.push({ category, platform, timeWindow });
                }
            }
        }
        
        // Process in batches
        const batchSize = CONFIG.CONCURRENT_BUILDS;
        const batches = [];
        for (let i = 0; i < pageJobs.length; i += batchSize) {
            batches.push(pageJobs.slice(i, i + batchSize));
        }
        
        console.log(`⚡ Processing ${batches.length} batches of ${batchSize} pages each...`);
        
        // Execute batches
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`\n📦 Processing batch ${i + 1}/${batches.length}...`);
            
            const batchPromises = batch.map(job => 
                this.generatePage(job.category, job.platform, job.timeWindow)
            );
            
            try {
                await Promise.all(batchPromises);
                console.log(`✅ Batch ${i + 1} completed`);
            } catch (error) {
                console.error(`❌ Batch ${i + 1} failed:`, error.message);
                // Continue with next batch
            }
        }
    }

    /**
     * Print build statistics
     */
    printBuildStats() {
        const duration = (Date.now() - this.buildStats.startTime) / 1000;
        
        console.log(`\n📊 BUILD STATISTICS`);
        console.log(`==================`);
        console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
        console.log(`📄 Pages generated: ${this.buildStats.pagesGenerated}`);
        console.log(`❌ Errors: ${this.buildStats.errors}`);
        console.log(`💾 Cache hits: ${this.buildStats.cacheHits}`);
        console.log(`🚀 Pages per second: ${(this.buildStats.pagesGenerated / duration).toFixed(2)}`);
        
        if (this.buildStats.pagesGenerated > 0) {
            console.log(`✅ Build completed successfully!`);
        } else {
            console.log(`❌ Build failed - no pages generated`);
        }
    }

    /**
     * Main build process
     */
    async build() {
        try {
            console.log(`🚀 Starting AI Tools Dashboard static build...`);
            
            // Initialize Firebase
            await this.initializeFirebase();
            
            // Clean and prepare output directory
            await fs.emptyDir(CONFIG.OUTPUT_DIR);
            console.log(`🧹 Cleaned output directory: ${CONFIG.OUTPUT_DIR}`);
            
            // Generate all pages
            await this.generateAllPages();
            
            // Copy static assets (will be implemented later)
            console.log(`📁 Static assets copying skipped for now`);
            
            // Print statistics
            this.printBuildStats();
            
        } catch (error) {
            console.error(`💥 Build failed:`, error.message);
            throw error;
        }
    }
}

// CLI execution
if (require.main === module) {
    const generator = new StaticSiteGenerator();
    
    generator.build()
        .then(() => {
            console.log(`\n🎉 Static site generation completed!`);
            process.exit(0);
        })
        .catch(error => {
            console.error(`\n💥 Static site generation failed:`, error);
            process.exit(1);
        });
}

module.exports = StaticSiteGenerator;