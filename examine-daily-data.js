#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./ai-tracker-466821-892ecf5150a3.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function examineDailyData() {
    try {
        console.log('🔍 EXAMINING DAILY HISTORICAL DATA STRUCTURE');
        console.log('==============================================\n');
        
        // Get daily documents from all_categories 7_days_daily
        const dailySnapshot = await db
            .collection('all_categories')
            .doc('all_categories')
            .collection('7_days_daily')
            .orderBy('date', 'desc')
            .limit(7)
            .get();
            
        console.log(`📅 Found ${dailySnapshot.docs.length} daily documents in all_categories/7_days_daily:\n`);
        
        for (const doc of dailySnapshot.docs) {
            const data = doc.data();
            console.log(`📊 Date: ${data.date || doc.id}`);
            console.log(`   Fields: ${Object.keys(data).join(', ')}`);
            
            // Check if keywords field contains actual products
            if (data.keywords && Object.keys(data.keywords).length > 0) {
                const productNames = Object.keys(data.keywords);
                console.log(`   🔑 Products (${productNames.length}): ${productNames.slice(0, 5).join(', ')}`);
                
                // Show structure of first few products
                const sampleProduct = data.keywords[productNames[0]];
                if (sampleProduct) {
                    console.log(`   📈 Sample product (${productNames[0]}):`, {
                        keyword: sampleProduct.keyword || 'N/A',
                        combined_score: sampleProduct.combined_score || 0,
                        reddit_post_count: sampleProduct.reddit_post_count || 0,
                        youtube_video_count: sampleProduct.youtube_video_count || 0
                    });
                }
            }
            
            // Check if 'all' field exists
            if (data.all && Object.keys(data.all).length > 0) {
                const allProductNames = Object.keys(data.all);
                console.log(`   🌐 'All' field products: ${allProductNames.slice(0, 3).join(', ')}`);
            }
            
            console.log('');
        }
        
        // Also check ai_chatbots for comparison
        console.log('\n🤖 CHECKING AI_CHATBOTS DAILY DATA:');
        console.log('=====================================\n');
        
        const chatbotsDaily = await db
            .collection('all_categories')
            .doc('ai_chatbots')
            .collection('7_days_daily')
            .orderBy('date', 'desc')
            .limit(3)
            .get();
            
        console.log(`Found ${chatbotsDaily.docs.length} documents in ai_chatbots/7_days_daily:\n`);
        
        for (const doc of chatbotsDaily.docs) {
            const data = doc.data();
            console.log(`📅 ${data.date || doc.id}:`);
            
            if (data.keywords) {
                const products = Object.keys(data.keywords);
                console.log(`   Products: ${products.join(', ')}`);
                
                // Check for ChatGPT specifically
                const chatgptKey = products.find(p => p.toLowerCase().includes('chatgpt') || p.toLowerCase().includes('gpt'));
                if (chatgptKey) {
                    const chatgpt = data.keywords[chatgptKey];
                    console.log(`   ChatGPT data: reddit=${chatgpt.reddit_post_count}, combined=${chatgpt.combined_score}`);
                }
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Error examining daily data:', error);
    }
}

examineDailyData();