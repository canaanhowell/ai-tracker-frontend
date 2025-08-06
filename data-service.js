// Data service for fetching from Firestore
// PERFORMANCE OPTIMIZATION: This service now expects pre-sorted data from Firebase
// All client-side sorting has been removed for faster loading

class DataService {
    constructor() {
        this.db = window.db;
        
        // Define invalid names that should be filtered/replaced
        this.invalidCategoryNames = [
            'all categories', 'all reddit', 'all youtube', 'all',
            'reddit', 'youtube', 'combined',
            'aggregated', 'summary', 'total', 'misc', 'other', 'unknown'
        ];
        
        this.invalidProductNames = [
            'all', 'total', 'summary', 'aggregated', 'combined', 
            'misc', 'other', 'unknown'
        ];
    }

    /**
     * Centralized data normalization for all Firebase data structures
     * Handles arrays, objects, and various field naming conventions
     */
    normalizeFirebaseEntry(key, value, sourceCategory = null) {
        let productName = key;
        let metrics = value;
        let wasNumericKey = false;
        
        // Handle object structure where key might be index and name is in metrics
        if (typeof value === 'object' && value !== null) {
            // If key is numeric, look for actual name in metrics
            if (/^\d+$/.test(key)) {
                wasNumericKey = true;
                if (value.keyword) {
                    productName = value.keyword;
                    console.log(`📦 Found keyword in metrics: "${key}" → "${productName}"`);
                } else if (value.name) {
                    productName = value.name;
                    console.log(`📦 Found name in metrics: "${key}" → "${productName}"`);
                } else if (value.product_name) {
                    productName = value.product_name;
                    console.log(`📦 Found product_name in metrics: "${key}" → "${productName}"`);
                } else if (value.productName) {
                    productName = value.productName;
                    console.log(`📦 Found productName in metrics: "${key}" → "${productName}"`);
                } else {
                    console.log(`⚠️ Numeric key "${key}" has no name field in metrics`);
                    return null; // Skip if numeric key has no name field
                }
            }
            metrics = value;
        } else {
            console.warn(`⚠️ Unexpected data structure for key "${key}":`, value);
            return null;
        }
        
        // Validate product name
        if (!productName || this.isInvalidProductName(productName)) {
            console.log(`🚫 Skipping invalid product: "${productName}"`);
            return null;
        }
        
        // Extract and validate category
        let category = this.extractCategory(metrics, sourceCategory);
        
        // Return normalized data
        return {
            name: productName,
            category: category,
            metrics: metrics
        };
    }
    
    /**
     * Extract and clean category from metrics or use source
     */
    extractCategory(metrics, sourceCategory) {
        // Try to get category from metrics first
        if (metrics.category && this.isValidCategory(metrics.category)) {
            return this.cleanCategoryName(metrics.category);
        } 
        
        // Use source category (document name) if valid
        if (sourceCategory && this.isValidCategory(sourceCategory)) {
            return this.cleanCategoryName(sourceCategory);
        }
        
        // Default fallback
        return 'General';
    }
    
    /**
     * Check if a category name is valid
     */
    isValidCategory(categoryName) {
        if (!categoryName || typeof categoryName !== 'string') return false;
        const cleanName = categoryName.toLowerCase().trim();
        return !this.invalidCategoryNames.includes(cleanName);
    }
    
    /**
     * Check if a product name is valid
     */
    isInvalidProductName(productName) {
        if (!productName || typeof productName !== 'string') return true;
        const cleanName = productName.toLowerCase().trim();
        return this.invalidProductNames.some(invalid => 
            cleanName === invalid.toLowerCase()
        );
    }
    
    /**
     * Clean and format category name
     */
    cleanCategoryName(categoryName) {
        return categoryName.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Fetch hot items from PH-dashboard (for "New" filter)
    async fetchHotItems() {
        try {
            console.log('Fetching hot items from PH-dashboard...');
            const doc = await this.db.collection('PH-dashboard').doc('hot_right_now').get();
            if (!doc.exists) {
                console.error('No hot items found');
                return [];
            }
            
            const data = doc.data();
            // Transform PH data to unified format
            return data.products.map((item, index) => ({
                rank: index + 1,
                name: item.product_name,
                category: 'trending', // Don't reveal specific categories for PH
                momentum: item.acceleration,
                velocity: item.velocity,
                votes: item.current_votes,
                source: 'ph'
            }));
        } catch (error) {
            console.error('Error fetching hot items:', error);
            console.error('Error details:', error.message, error.code);
            throw error; // Re-throw to see in main error handler
        }
    }

    // Fetch trending items from PH-dashboard "top_this_week" document
    async fetchTopThisWeek() {
        try {
            console.log('Fetching top_this_week from PH-dashboard...');
            const doc = await this.db.collection('PH-dashboard').doc('top_this_week').get();
            if (!doc.exists) {
                console.error('top_this_week document not found');
                return [];
            }
            
            const data = doc.data();
            console.log('top_this_week data structure:', Object.keys(data));
            
            // Transform PH trending data to unified format
            if (data.products && Array.isArray(data.products)) {
                return data.products.map((item, index) => ({
                    rank: index + 1,
                    name: item.product_name || item.name,
                    category: item.category || 'trending',
                    velocity: item.velocity || item.weekly_velocity || 0,
                    momentum: item.acceleration || item.momentum || 0,
                    votes: item.current_votes || item.votes,
                    source: 'ph-weekly'
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching top_this_week:', error);
            console.error('Error details:', error.message, error.code);
            return []; // Return empty array instead of throwing to avoid breaking UI
        }
    }

    // Fetch trending items from PH-dashboard "top_this_month" document
    async fetchTopThisMonth() {
        try {
            console.log('Fetching top_this_month from PH-dashboard...');
            
            // First, let's check what documents exist in PH-dashboard
            console.log('Checking available documents in PH-dashboard...');
            const collectionSnapshot = await this.db.collection('PH-dashboard').limit(10).get();
            const availableDocs = collectionSnapshot.docs.map(doc => doc.id);
            console.log('Available PH-dashboard documents:', availableDocs);
            
            const doc = await this.db.collection('PH-dashboard').doc('top_this_month').get();
            if (!doc.exists) {
                console.error('top_this_month document not found');
                console.log('Available documents:', availableDocs);
                
                // Fallback to top_this_week if top_this_month doesn't exist
                console.log('Falling back to top_this_week...');
                const weekDoc = await this.db.collection('PH-dashboard').doc('top_this_week').get();
                if (weekDoc.exists) {
                    const weekData = weekDoc.data();
                    console.log('Using top_this_week data instead');
                    
                    if (weekData.products && Array.isArray(weekData.products)) {
                        return weekData.products.map((item, index) => ({
                            rank: index + 1,
                            name: item.product_name || item.name,
                            category: item.category || 'trending',
                            score: item.trend_score || item.score || item.velocity || 0,
                            momentum: item.acceleration || item.momentum || 0,
                            votes: item.current_votes || item.votes,
                            source: 'ph-weekly-fallback'
                        }));
                    }
                }
                return [];
            }
            
            const data = doc.data();
            console.log('top_this_month data structure:', Object.keys(data));
            console.log('Sample data:', data);
            
            // Transform PH trending data to unified format
            if (data.products && Array.isArray(data.products)) {
                console.log('📊 First product raw data:', data.products[0]);
                console.log('📊 Available fields in first product:', Object.keys(data.products[0] || {}));
                
                return data.products.map((item, index) => {
                    const score = item.score || item.trend_score || item.velocity || item.current_votes || 0;
                    console.log(`🏆 Product "${item.product_name}": trend_score=${item.trend_score}, score=${item.score}, velocity=${item.velocity}, current_votes=${item.current_votes} → final score=${score}`);
                    
                    return {
                        rank: index + 1,
                        name: item.product_name || item.name,
                        category: item.category || 'trending',
                        score: score,
                        momentum: item.acceleration || item.momentum || 0,
                        votes: item.current_votes || item.votes,
                        source: 'ph-monthly'
                    };
                });
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching top_this_month:', error);
            console.error('Error details:', error.message, error.code);
            return []; // Return empty array instead of throwing to avoid breaking UI
        }
    }

    // Fetch YouTube data with simplified logic and fallback
    async fetchYoutubeDataSimple(timeWindow, category) {
        try {
            console.log(`🎥 Fetching YouTube data - Category: ${category}, Time: ${timeWindow}`);
            
            // Try to get YouTube-specific data first
            const docId = category === 'all' ? 'ai_chatbots' : category;
            console.log(`🔍 Looking for YouTube document: youtube_categories/${docId}`);
            
            const doc = await this.db.collection('youtube_categories').doc(docId).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log('📊 YouTube document structure:', Object.keys(data));
                
                // Try to find time window data
                const windowData = data[`${timeWindow}_days`];
                if (windowData && typeof windowData === 'object') {
                    console.log('✅ Found YouTube time window data');
                    
                    // Use centralized normalization for YouTube data
                    const items = Object.entries(windowData)
                        .map(([key, value]) => {
                            const normalized = this.normalizeFirebaseEntry(key, value, category === 'all' ? 'media' : category);
                            if (!normalized) return null;
                            
                            const metrics = normalized.metrics;
                            // Must have YouTube-specific metrics
                            if (metrics.velocity === undefined && metrics.video_count === undefined) return null;
                            
                            const videoCount = metrics.video_count || metrics.new_videos_in_day || 0;
                            
                            return {
                                name: normalized.name,
                                category: normalized.category,
                                momentum: metrics.acceleration || 0,
                                velocity: metrics.velocity || 0,
                                videoCount: videoCount,
                                source: 'youtube',
                                preRank: metrics.rank || null
                            };
                        })
                        .filter(item => item !== null);
                    
                    console.log(`📊 YouTube data received (expecting pre-sorted from Firebase):`);
                    console.log(`  - Total items: ${items.length}`);
                    console.log(`  - Items with pre-rank: ${items.filter(item => item.preRank).length}`);
                    
                    // If Firebase data includes ranks, sort by rank; otherwise assume already sorted
                    if (items.some(item => item.preRank)) {
                        console.log('🔢 Sorting by Firebase pre-calculated ranks');
                        items.sort((a, b) => (a.preRank || 999) - (b.preRank || 999));
                    } else {
                        console.log('✅ Using Firebase query order (assumed pre-sorted)');
                    }
                    
                    if (items.length > 0) {
                        const rankedItems = items.map((item, index) => ({ ...item, rank: index + 1 }));
                        console.log(`✅ Found ${rankedItems.length} YouTube items`);
                        return rankedItems;
                    }
                }
            }
            
            // Fallback: Filter combined data to show only YouTube-related items
            console.log('⚠️ No YouTube-specific data found, filtering combined data for YouTube items');
            const combinedData = await this.fetchCombinedData(timeWindow, category);
            
            if (combinedData.length > 0) {
                // Filter and adapt combined data to look like YouTube data
                const youtubeItems = combinedData
                    .filter(item => item.youtubeVideos > 0 || item.videoCount > 0)
                    .map(item => ({
                        name: item.name,
                        category: item.category,
                        momentum: item.momentum,
                        velocity: item.velocity,
                        videoCount: item.youtubeVideos || item.videoCount || 0,
                        source: 'youtube-filtered',
                        rank: item.rank
                    }));
                    
                console.log(`✅ Filtered ${youtubeItems.length} items with YouTube data from combined source`);
                return youtubeItems;
            }
            
            console.warn('❌ No YouTube data available from any source');
            return [];
            
        } catch (error) {
            console.error('Error fetching YouTube data:', error);
            return [];
        }
    }

    // Fetch Reddit category data
    async fetchRedditData(timeWindow, category) {
        try {
            console.log(`Fetching Reddit data for category: ${category}, timeWindow: ${timeWindow}`);
            const docId = category === 'all' ? 'ai_chatbots' : category; // TODO: aggregate all categories
            console.log(`Looking for document: reddit_categories/${docId}`);
            const doc = await this.db.collection('reddit_categories').doc(docId).get();
            if (!doc.exists) {
                console.error('Reddit category not found:', category);
                return [];
            }
            
            const data = doc.data();
            const windowData = data[`${timeWindow}_days`];
            if (!windowData) {
                console.error('Time window not found:', timeWindow);
                return [];
            }
            
            // Convert object to array using centralized normalization
            const items = Object.entries(windowData)
                .map(([key, value]) => {
                    const normalized = this.normalizeFirebaseEntry(key, value, category);
                    if (!normalized) return null;
                    
                    const metrics = normalized.metrics;
                    // Must have velocity for Reddit data
                    if (metrics.velocity === undefined) return null;
                    
                    return {
                        name: normalized.name,
                        category: normalized.category,
                        momentum: metrics.acceleration || 0,
                        velocity: metrics.velocity,
                        postCount: metrics.post_count || 0,
                        source: 'reddit',
                        preRank: metrics.rank || null
                    };
                })
                .filter(item => item !== null);
            
            console.log(`📊 Reddit data received (expecting pre-sorted from Firebase):`);
            console.log(`  - Total items: ${items.length}`);
            console.log(`  - Items with pre-rank: ${items.filter(item => item.preRank).length}`);
            
            // If Firebase data includes ranks, sort by rank; otherwise assume already sorted by Firebase query
            if (items.some(item => item.preRank)) {
                console.log('🔢 Sorting by Firebase pre-calculated ranks');
                items.sort((a, b) => (a.preRank || 999) - (b.preRank || 999));
            } else {
                console.log('✅ Using Firebase query order (assumed pre-sorted)');
            }
            
            // Add rank
            return items.map((item, index) => ({
                ...item,
                rank: index + 1
            }));
        } catch (error) {
            console.error('Error fetching Reddit data:', error);
            return [];
        }
    }

    // Fetch YouTube category data
    async fetchYoutubeData(timeWindow, category) {
        try {
            console.log(`🟡 === YOUTUBE DATA FETCH START ===`);
            console.log(`📊 Category: ${category}, Time Window: ${timeWindow}`);
            const docId = category === 'all' ? 'ai_chatbots' : category; // TODO: aggregate all categories
            console.log(`📁 Document ID: ${docId}`);
            console.log(`🔍 Looking for document: youtube_categories/${docId}`);
            
            const doc = await this.db.collection('youtube_categories').doc(docId).get();
            console.log(`📄 Document exists: ${doc.exists}`);
            
            if (!doc.exists) {
                console.error('❌ YouTube category not found:', category);
                return [];
            }
            
            const data = doc.data();
            console.log('📋 YouTube document data structure:', Object.keys(data));
            console.log('📊 Full document data:', data);
            
            // First try to get data directly from the document (similar to Reddit structure)
            const windowData = data[`${timeWindow}_days`];
            console.log(`🔍 Looking for key: "${timeWindow}_days"`);
            console.log(`📊 Window data exists: ${windowData ? 'YES' : 'NO'}`);
            console.log(`📊 Window data type: ${typeof windowData}`);
            
            if (windowData && typeof windowData === 'object') {
                console.log('✅ Found time window data in main document');
                console.log('📊 Window data keys:', Object.keys(windowData));
                
                // Convert object to array and sort by velocity
                const items = Object.entries(windowData)
                    .filter(([key, value]) => {
                        const isValid = typeof value === 'object' && value.velocity !== undefined;
                        console.log(`🔍 Checking key "${key}": valid=${isValid}`, value);
                        return isValid;
                    })
                    .map(([keyword, metrics]) => {
                        // Handle new Firebase structure where product name might be in metrics.name
                        let productName = keyword;
                        
                        // If keyword is a number (like "0", "1", "2"), the real name is likely in metrics
                        if (/^\d+$/.test(keyword) && metrics.name) {
                            productName = metrics.name;
                            console.log(`🔄 YouTube (main doc): Using metrics.name "${metrics.name}" instead of key "${keyword}"`);
                        } else if (metrics.product_name) {
                            productName = metrics.product_name;
                            console.log(`🔄 YouTube (main doc): Using metrics.product_name "${metrics.product_name}" instead of key "${keyword}"`);
                        }
                        
                        return {
                            name: productName,
                            category: category === 'all' ? 'media' : category,
                            momentum: metrics.acceleration,
                            velocity: metrics.velocity,
                            videoCount: metrics.video_count,
                            source: 'youtube'
                        };
                    })
                    .sort((a, b) => b.velocity - a.velocity);
                
                console.log(`✅ Processed ${items.length} YouTube items from main document`);
                
                // Add rank
                const rankedItems = items.map((item, index) => ({
                    ...item,
                    rank: index + 1
                }));
                
                console.log('✅ YouTube data from main document:', rankedItems);
                return rankedItems;
            }
            
            // If not found in main document, try different subcollection naming patterns
            const possibleSubcollections = [
                `${timeWindow}_days_daily`,
                `${timeWindow}_day_daily`, 
                `${timeWindow}d_daily`,
                `${timeWindow}_days`,
                `daily_${timeWindow}_days`
            ];
            
            console.log(`🔍 Trying multiple subcollection patterns...`);
            let snapshot = null;
            let usedCollection = null;
            
            for (const collectionName of possibleSubcollections) {
                try {
                    console.log(`🔍 Trying subcollection: ${docId}/${collectionName}`);
                    const testSnapshot = await this.db
                        .collection('youtube_categories')
                        .doc(docId)
                        .collection(collectionName)
                        .limit(1)
                        .get();
                    
                    if (!testSnapshot.empty) {
                        console.log(`✅ Found data in subcollection: ${collectionName}`);
                        snapshot = await this.db
                            .collection('youtube_categories')
                            .doc(docId)
                            .collection(collectionName)
                            .limit(10)
                            .get();
                        usedCollection = collectionName;
                        break;
                    } else {
                        console.log(`❌ Empty subcollection: ${collectionName}`);
                    }
                } catch (err) {
                    console.log(`❌ Error accessing subcollection ${collectionName}:`, err.message);
                }
            }
            
            if (!snapshot || snapshot.empty) {
                console.error('❌ No YouTube data found in any subcollection for time window:', timeWindow);
                return [];
            }
            
            console.log(`✅ Using subcollection: ${usedCollection} with ${snapshot.docs.length} documents`);
            
            // Process all documents and find the most recent one
            let latestData = null;
            let latestDate = null;
            
            snapshot.docs.forEach(doc => {
                const docData = doc.data();
                const docDate = docData.date;
                if (!latestDate || (docDate && docDate > latestDate)) {
                    latestDate = docDate;
                    latestData = docData;
                }
            });
            
            if (!latestData) {
                console.error('No valid YouTube data found');
                return [];
            }
            
            const keywords = latestData.keywords || {};
            console.log(`Found ${Object.keys(keywords).length} YouTube keywords`);
            
            // Convert to array and sort by velocity
            const items = Object.entries(keywords)
                .map(([keyword, metrics]) => {
                    // Handle new Firebase structure where product name might be in metrics.name
                    let productName = keyword;
                    
                    // If keyword is a number (like "0", "1", "2"), the real name is likely in metrics
                    if (/^\d+$/.test(keyword) && metrics.name) {
                        productName = metrics.name;
                        console.log(`🔄 YouTube (subcollection): Using metrics.name "${metrics.name}" instead of key "${keyword}"`);
                    } else if (metrics.product_name) {
                        productName = metrics.product_name;
                        console.log(`🔄 YouTube (subcollection): Using metrics.product_name "${metrics.product_name}" instead of key "${keyword}"`);
                    }
                    
                    return {
                        name: productName,
                        category: category === 'all' ? 'media' : category,
                        momentum: metrics.acceleration,
                        velocity: metrics.velocity,
                        videoCount: metrics.video_count,
                        source: 'youtube'
                    };
                })
                .sort((a, b) => b.velocity - a.velocity);
            
            // Add rank
            return items.map((item, index) => ({
                ...item,
                rank: index + 1
            }));
        } catch (error) {
            console.error('Error fetching YouTube data:', error);
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                console.error('MISSING INDEX: You need to create a composite index for this query');
                console.error('Collection: youtube_categories');
                console.error('Subcollection: X_days_daily');
                console.error('Fields: date (descending)');
            }
            // Don't re-throw, return empty array to avoid breaking the UI
            return [];
        }
    }

    // Fetch list of available categories from all_categories collection
    async fetchCategoriesList() {
        try {
            console.log('🔍 Starting fetchCategoriesList...');
            console.log('🔥 Firebase db object:', this.db);
            console.log('🔗 Attempting to fetch from all_categories collection...');
            
            const snapshot = await this.db.collection('all_categories').get();
            console.log('📄 Snapshot received:', snapshot);
            console.log('📊 Snapshot.empty:', snapshot.empty);
            console.log('📝 Snapshot.size:', snapshot.size);
            
            if (snapshot.empty) {
                console.error('❌ No categories found in all_categories collection');
                console.log('🔍 Let me try to list all collections to see what exists...');
                
                // Let's try some other collection names that might exist
                const possibleCollections = ['all_categories', 'reddit_categories', 'youtube_categories', 'PH-dashboard'];
                
                for (const collectionName of possibleCollections) {
                    try {
                        console.log(`🔍 Trying collection: ${collectionName}`);
                        const testSnapshot = await this.db.collection(collectionName).limit(1).get();
                        console.log(`📊 ${collectionName} exists: ${!testSnapshot.empty}, size: ${testSnapshot.size}`);
                        if (!testSnapshot.empty) {
                            console.log(`📋 Sample doc from ${collectionName}:`, testSnapshot.docs[0].id);
                        }
                    } catch (err) {
                        console.log(`❌ Error accessing ${collectionName}:`, err.message);
                    }
                }
                
                return [];
            }
            
            const categories = [];
            snapshot.docs.forEach(doc => {
                const categoryId = doc.id;
                const categoryData = doc.data();
                
                // Create a display-friendly category name
                const displayName = categoryId.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                categories.push({
                    id: categoryId,
                    name: displayName,
                    hasData: categoryData && Object.keys(categoryData).length > 0
                });
            });
            
            // Sort categories alphabetically
            categories.sort((a, b) => a.name.localeCompare(b.name));
            
            console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
            return categories;
            
        } catch (error) {
            console.error('Error fetching categories list:', error);
            return [];
        }
    }

    // Fetch combined data from all_categories
    async fetchCombinedData(timeWindow, category) {
        const startTime = performance.now(); // Performance timing
        try {
            console.log(`🚀 Fetching combined data for category: ${category}, timeWindow: ${timeWindow}`);
            
            // For all_categories collection, each category has its own document
            let allData = {};
            
            if (category === 'all') {
                // Aggregate from all category documents
                console.log('🔍 Fetching all categories - aggregating from all documents...');
                
                try {
                    const snapshot = await this.db.collection('all_categories').get();
                    const categoryPromises = [];
                    
                    snapshot.forEach(doc => {
                        const categoryName = doc.id;
                        
                        // Skip aggregate documents when building "all categories" view
                        if (categoryName === 'all_categories' || categoryName === 'all_reddit' || categoryName === 'reddit') {
                            console.log(`⏭️ Skipping aggregate document: ${categoryName}`);
                            return;
                        }
                        
                        console.log(`📂 Found category document: ${categoryName}`);
                        categoryPromises.push({
                            categoryName,
                            data: doc.data()
                        });
                    });
                    
                    // Merge all category data into one object
                    categoryPromises.forEach(({categoryName, data}) => {
                        if (data && data[`${timeWindow}_days`]) {
                            const timeWindowData = data[`${timeWindow}_days`];
                            
                            Object.entries(timeWindowData).forEach(([keyword, value]) => {
                                // Use centralized normalization
                                const normalized = this.normalizeFirebaseEntry(keyword, value, categoryName);
                                
                                if (normalized) {
                                    // Store with the actual product name as key
                                    allData[normalized.name] = {
                                        ...normalized.metrics,
                                        category: normalized.category,
                                        _sourceDoc: categoryName // Keep for debugging
                                    };
                                }
                            });
                        }
                    });
                    
                    console.log(`✅ Aggregated data from ${categoryPromises.length} categories, total products: ${Object.keys(allData).length}`);
                    
                } catch (error) {
                    console.error('Error aggregating all categories:', error);
                    return [];
                }
                
            } else {
                // Single category fetch
                const doc = await this.db.collection('all_categories').doc(category).get();
                if (!doc.exists) {
                    console.error(`Category document not found: ${category}`);
                    return [];
                }
                allData = doc.data();
            }
            
            // Check if we have any data
            if (Object.keys(allData).length === 0) {
                console.error('❌ No combined data found for category:', category);
                return [];
            }

            console.log(`✅ Processing combined data for category: ${category}`);
            
            // For aggregated data, the windowData is already extracted and merged
            // For single category, we need to extract the time window
            let windowData;
            if (category === 'all') {
                windowData = allData; // Already processed and merged
                console.log(`📊 Aggregated window data with ${Object.keys(windowData).length} products`);
            } else {
                windowData = allData[`${timeWindow}_days`];
                console.log(`📊 Single category data keys:`, Object.keys(allData));
                console.log(`🔍 Looking for timeWindow: "${timeWindow}_days"`);
                console.log(`📋 Window data found:`, windowData ? 'YES' : 'NO');
                if (!windowData) {
                    console.error(`❌ Time window ${timeWindow}_days not found in document ${category}`);
                    return [];
                }
            }
            
            // Additional validation for single category data
            if (!windowData && category !== 'all') {
                console.error('❌ Time window not found:', timeWindow);
                console.log('📊 Available time windows:', Object.keys(allData).filter(key => key.includes('_days')));
                return [];
            }
            
            // Extract individual keywords
            console.log(`📊 Window data structure for ${category}:`, Object.keys(windowData));
            console.log(`📋 First 5 entries RAW:`, Object.entries(windowData).slice(0, 5));
            
            // Log sample data structure for debugging
            const sampleEntry = Object.entries(windowData)[0];
            if (sampleEntry) {
                console.log(`📊 Sample data structure: key="${sampleEntry[0]}", type=${Array.isArray(sampleEntry[1]) ? 'array' : typeof sampleEntry[1]}`);
            }
            
            
            const items = Object.entries(windowData)
                .map(([key, value]) => this.normalizeFirebaseEntry(key, value, category))
                .filter(normalized => {
                    if (!normalized) return false;
                    
                    // Must have some meaningful metrics
                    const metrics = normalized.metrics;
                    const hasValidMetrics = 
                        metrics.post_count !== undefined || 
                        metrics.reddit_post_count !== undefined || 
                        metrics.velocity !== undefined ||
                        metrics.combined_score !== undefined;
                    
                    return hasValidMetrics;
                });
            
            
            const finalItems = items.map(normalized => {
                const metrics = normalized.metrics;
                
                return {
                    name: normalized.name,
                    category: normalized.category,
                    momentum: metrics.acceleration || 0,
                    velocity: metrics.velocity || 0,
                    combinedScore: metrics.combined_score || 0,
                    post_count: metrics.reddit_post_count || metrics.post_count || 0,
                    redditPosts: metrics.reddit_post_count || 0,
                    youtubeVideos: metrics.youtube_video_count || 0,
                    source: 'combined',
                    preRank: metrics.rank || null
                };
            });
            
            console.log(`📊 Combined data received (expecting pre-sorted from Firebase):`);
            console.log(`  - Total items: ${finalItems.length}`);
            console.log(`  - Items with pre-rank: ${finalItems.filter(item => item.preRank).length}`);
            
            // If Firebase data includes ranks, sort by rank; otherwise assume already sorted by Firebase query  
            if (finalItems.some(item => item.preRank)) {
                console.log('🔢 Sorting by Firebase pre-calculated ranks');
                finalItems.sort((a, b) => (a.preRank || 999) - (b.preRank || 999));
            } else {
                console.log('✅ Using Firebase query order (assumed pre-sorted)');
            }
            
            console.log(`📊 Top 3 combined data items:`);
            finalItems.slice(0, 3).forEach((item, index) => {
                console.log(`${index + 1}. ${item.name}: post_count=${item.post_count}, velocity=${item.velocity}, preRank=${item.preRank}`);
            });
            
            // Add rank
            const result = finalItems.map((item, index) => ({
                ...item,
                rank: index + 1
            }));
            
            const endTime = performance.now();
            console.log(`⚡ Combined data fetched in ${(endTime - startTime).toFixed(2)}ms (NO CLIENT SORTING)`);
            
            return result;
        } catch (error) {
            console.error('Error fetching combined data:', error);
            return [];
        }
    }
}

// Export for use in other modules
window.DataService = DataService;