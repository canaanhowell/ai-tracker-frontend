#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./ai-tracker-466821-892ecf5150a3.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function mapHistoricalData() {
    try {
        console.log('📈 MAPPING CHATGPT HISTORICAL DATA FROM FIREBASE');
        console.log('=================================================\n');
        
        // Get 7 days of historical data for all_categories
        const snapshot = await db
            .collection('all_categories')
            .doc('all_categories')
            .collection('7_days_daily')
            .orderBy('date', 'desc')
            .limit(7)
            .get();
            
        console.log(`Found ${snapshot.docs.length} days of data:\n`);
        
        const historicalData = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`📅 Date: ${data.date}`);
            
            if (data.keywords) {
                // Find ChatGPT in the keywords
                Object.entries(data.keywords).forEach(([key, product]) => {
                    if (product.keyword && product.keyword.toLowerCase().includes('chatgpt')) {
                        console.log(`   🤖 ChatGPT found (key: ${key}):`);
                        console.log(`      Combined Score: ${product.combined_score}`);
                        console.log(`      Reddit Posts: ${product.reddit_post_count}`);
                        console.log(`      YouTube Videos: ${product.youtube_video_count}`);
                        
                        historicalData.push({
                            date: data.date,
                            combined_score: product.combined_score,
                            reddit_post_count: product.reddit_post_count,
                            youtube_video_count: product.youtube_video_count
                        });
                    }
                });
            }
            console.log('');
        });
        
        // Sort by date ascending for chart display
        historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        console.log('📊 CHATGPT TIME SERIES DATA (oldest to newest):');
        console.log('===============================================\n');
        
        const labels = [];
        const combinedScores = [];
        const redditCounts = [];
        const youtubeVideos = [];
        
        historicalData.forEach(point => {
            const date = new Date(point.date);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(label);
            combinedScores.push(point.combined_score);
            redditCounts.push(point.reddit_post_count);
            youtubeVideos.push(point.youtube_video_count);
            
            console.log(`${label}: Combined=${point.combined_score}, Reddit=${point.reddit_post_count}, YouTube=${point.youtube_video_count}`);
        });
        
        console.log('\n🎯 PERFECT CHART DATA:');
        console.log('====================\n');
        console.log('Labels:', JSON.stringify(labels));
        console.log('Combined Scores:', JSON.stringify(combinedScores));
        console.log('Reddit Counts:', JSON.stringify(redditCounts));
        
        // Show the difference from current fake data
        console.log('\n❌ CURRENT FAKE DATA vs ✅ REAL DATA:');
        console.log('=====================================');
        console.log('❌ Fake: [12396,12396,12396,12396,12396,12396,12396]');
        console.log('✅ Real Reddit:', JSON.stringify(redditCounts));
        console.log('✅ Real Combined:', JSON.stringify(combinedScores));
        
    } catch (error) {
        console.error('❌ Error mapping historical data:', error);
    }
}

mapHistoricalData();