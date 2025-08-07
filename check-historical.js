#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./ai-tracker-466821-892ecf5150a3.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function checkHistoricalData() {
    try {
        console.log('🔍 Checking ai_chatbots daily data...');
        
        // Check last 7 days of data
        const snapshot = await db
            .collection('ai_chatbots')
            .doc('7_days_daily')
            .collection('daily')
            .orderBy('date', 'desc')
            .limit(7)
            .get();
            
        console.log(`Found ${snapshot.docs.length} daily documents`);
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`\n📅 Date: ${data.date}`);
            
            if (data.keywords) {
                const products = Object.keys(data.keywords);
                console.log(`Products: ${products.slice(0, 3).join(', ')} (${products.length} total)`);
                
                // Show ChatGPT data if it exists
                if (data.keywords['chatgpt'] || data.keywords['Chatgpt']) {
                    const chatgpt = data.keywords['chatgpt'] || data.keywords['Chatgpt'];
                    console.log(`ChatGPT: reddit=${chatgpt.reddit_post_count}, combined=${chatgpt.combined_score}`);
                }
                
                // Show Claude data if it exists
                if (data.keywords['claude'] || data.keywords['Claude']) {
                    const claude = data.keywords['claude'] || data.keywords['Claude'];
                    console.log(`Claude: reddit=${claude.reddit_post_count}, combined=${claude.combined_score}`);
                }
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkHistoricalData();