/**
 * DataService - Handles all Firebase data fetching for the AI Tools Dashboard
 * Provides methods to fetch categories, rankings, trending data, and performance metrics
 */
class DataService {
    constructor() {
        this.db = window.db;
        if (!this.db) {
            console.error('Firebase Firestore not initialized');
            throw new Error('Firebase Firestore not initialized');
        }
        console.log('✅ DataService initialized');
    }

    /**
     * Fetch list of all available categories from Firebase
     * @returns {Promise<Array>} Array of category objects with id and name
     */
    async fetchCategoriesList() {
        try {
            console.log('📋 Fetching categories from all_categories collection...');
            
            const snapshot = await this.db.collection('all_categories').get();
            const categories = [];
            
            snapshot.forEach(doc => {
                const categoryId = doc.id;
                
                // Skip unwanted categories
                const excludedCategories = ['reddit', 'all_reddit', 'all_categories'];
                if (!excludedCategories.includes(categoryId.toLowerCase())) {
                    categories.push({
                        id: categoryId,
                        name: this.cleanText(categoryId)
                    });
                }
            });
            
            // Sort alphabetically
            categories.sort((a, b) => a.name.localeCompare(b.name));
            
            console.log(`✅ Fetched ${categories.length} categories:`, categories);
            return categories;
            
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            throw error;
        }
    }

    /**
     * Fetch trending data from Product Hunt integration
     * @returns {Promise<Array>} Array of trending products
     */
    async fetchTopThisMonth() {
        try {
            console.log('📈 Fetching trending data from PH-dashboard...');
            
            const doc = await this.db.collection('PH-dashboard').doc('top_this_month').get();
            
            if (!doc.exists) {
                console.warn('⚠️ PH-dashboard/top_this_month document not found');
                return [];
            }
            
            const data = doc.data();
            const products = [];
            
            // Extract products from the document
            if (data.products && Array.isArray(data.products)) {
                products.push(...data.products);
            } else if (data.all) {
                // Handle nested 'all' object structure
                Object.values(data.all).forEach((product, index) => {
                    if (product && typeof product === 'object') {
                        products.push({
                            rank: index + 1,
                            name: product.name || 'Unknown',
                            category: product.category || 'Unknown',
                            score: product.score || product.votes || 0
                        });
                    }
                });
            }
            
            console.log(`✅ Fetched ${products.length} trending products`);
            return products.slice(0, 5); // Return top 5
            
        } catch (error) {
            console.error('❌ Error fetching trending data:', error);
            return [];
        }
    }

    /**
     * Fetch combined data (all platforms) for rankings
     * @param {string} timeWindow - Time period (7, 30, or 90)
     * @param {string} category - Category filter ('all' or specific category)
     * @returns {Promise<Array>} Array of ranked products
     */
    async fetchCombinedData(timeWindow = '30', category = 'all') {
        try {
            console.log(`📊 Fetching combined data - Time: ${timeWindow}d, Category: ${category}`);
            
            const collectionPath = category === 'all' ? 'all_categories' : `all_categories`;
            const docId = category === 'all' ? 'all_categories' : category;
            const subcollection = `${timeWindow}_days_daily`;
            
            const snapshot = await this.db
                .collection(collectionPath)
                .doc(docId)
                .collection(subcollection)
                .orderBy('date', 'desc')
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                console.warn(`⚠️ No data found for ${category}/${subcollection}`);
                return [];
            }
            
            const latestDoc = snapshot.docs[0];
            const data = latestDoc.data();
            
            return this.extractAndRankProducts(data, 'combined');
            
        } catch (error) {
            console.error('❌ Error fetching combined data:', error);
            throw error;
        }
    }

    /**
     * Fetch Reddit-only data for rankings
     * @param {string} timeWindow - Time period (7, 30, or 90)
     * @param {string} category - Category filter ('all' or specific category)
     * @returns {Promise<Array>} Array of ranked products
     */
    async fetchRedditData(timeWindow = '30', category = 'all') {
        try {
            console.log(`📰 Fetching Reddit data - Time: ${timeWindow}d, Category: ${category}`);
            
            const collectionPath = category === 'all' ? 'all_categories' : `all_categories`;
            const docId = category === 'all' ? 'all_categories' : category;
            const subcollection = `${timeWindow}_days_daily`;
            
            const snapshot = await this.db
                .collection(collectionPath)
                .doc(docId)
                .collection(subcollection)
                .orderBy('date', 'desc')
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                console.warn(`⚠️ No Reddit data found for ${category}/${subcollection}`);
                return [];
            }
            
            const latestDoc = snapshot.docs[0];
            const data = latestDoc.data();
            
            return this.extractAndRankProducts(data, 'reddit');
            
        } catch (error) {
            console.error('❌ Error fetching Reddit data:', error);
            throw error;
        }
    }

    /**
     * Fetch YouTube-only data for rankings
     * @param {string} timeWindow - Time period (7, 30, or 90)
     * @param {string} category - Category filter ('all' or specific category)
     * @returns {Promise<Array>} Array of ranked products
     */
    async fetchYoutubeDataSimple(timeWindow = '30', category = 'all') {
        try {
            console.log(`📺 Fetching YouTube data - Time: ${timeWindow}d, Category: ${category}`);
            
            const collectionPath = category === 'all' ? 'all_categories' : `all_categories`;
            const docId = category === 'all' ? 'all_categories' : category;
            const subcollection = `${timeWindow}_days_daily`;
            
            const snapshot = await this.db
                .collection(collectionPath)
                .doc(docId)
                .collection(subcollection)
                .orderBy('date', 'desc')
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                console.warn(`⚠️ No YouTube data found for ${category}/${subcollection}`);
                return [];
            }
            
            const latestDoc = snapshot.docs[0];
            const data = latestDoc.data();
            
            return this.extractAndRankProducts(data, 'youtube');
            
        } catch (error) {
            console.error('❌ Error fetching YouTube data:', error);
            throw error;
        }
    }

    /**
     * Extract and rank products from Firebase document data
     * @param {Object} data - Firebase document data
     * @param {string} platform - Platform type ('combined', 'reddit', 'youtube')
     * @returns {Array} Array of ranked products
     */
    extractAndRankProducts(data, platform = 'combined') {
        const products = [];
        
        // Extract products from 'all' nested object (newer data structure)
        if (data.all && typeof data.all === 'object') {
            Object.entries(data.all).forEach(([key, product]) => {
                if (product && typeof product === 'object') {
                    let score = 0;
                    let count = 0;
                    
                    // Determine score based on platform
                    switch (platform) {
                        case 'reddit':
                            score = product.reddit_post_count || product.postCount || 0;
                            count = score;
                            break;
                        case 'youtube':
                            score = product.youtube_video_count || product.videoCount || 0;
                            count = score;
                            break;
                        case 'combined':
                        default:
                            score = product.combined_score || product.post_count || 0;
                            count = score;
                            break;
                    }
                    
                    if (score > 0) {
                        products.push({
                            name: product.name || key,
                            category: product.category || 'Unknown',
                            post_count: count,
                            postCount: count,
                            videoCount: count,
                            velocity: product.velocity || 0,
                            momentum: product.momentum || product.acceleration || 0,
                            combined_score: score
                        });
                    }
                }
            });
        }
        
        // Sort by score (descending) and add ranks
        products.sort((a, b) => {
            const scoreA = a.combined_score || a.post_count || a.postCount || a.videoCount || 0;
            const scoreB = b.combined_score || b.post_count || b.postCount || b.videoCount || 0;
            return scoreB - scoreA;
        });
        
        // Add rank property
        products.forEach((product, index) => {
            product.rank = index + 1;
        });
        
        console.log(`✅ Extracted ${products.length} products for ${platform} platform`);
        return products;
    }

    /**
     * Clean text by converting underscores to spaces and capitalizing words
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/_/g, ' ')  // Replace underscores with spaces
            .split(' ')          // Split into words
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
            .join(' ');          // Join back together
    }
}

// Export the class for use in other scripts
window.DataService = DataService;