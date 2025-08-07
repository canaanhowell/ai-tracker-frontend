#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./ai-tracker-466821-892ecf5150a3.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function checkDailyStructure() {
    try {
        console.log('🔍 Checking daily data structure...');
        
        // Check if data is in main document instead of subcollections
        const doc = await db.collection('ai_chatbots').doc('7_days_daily').get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('Main 7_days_daily document fields:', Object.keys(data));
            
            if (data.keywords) {
                console.log('Number of products in keywords:', Object.keys(data.keywords).length);
                
                // Show sample product data
                const firstProduct = Object.values(data.keywords)[0];
                console.log('Sample product structure:', Object.keys(firstProduct));
                
                // Check if there's historical data in the product itself
                if (firstProduct.historical || firstProduct.daily_data || firstProduct.trend_data) {
                    console.log('✅ Found historical data in product!');
                    console.log('Historical keys:', Object.keys(firstProduct.historical || firstProduct.daily_data || firstProduct.trend_data));
                }
            }
        }
        
        // Also check the all_categories structure
        console.log('\n🔍 Checking all_categories daily structure...');
        const allCatSnap = await db.collection('all_categories').doc('30_days_daily').collection('daily').orderBy('date', 'desc').limit(5).get();
        
        console.log(`Found ${allCatSnap.docs.length} daily documents in all_categories`);
        allCatSnap.docs.forEach(doc => {
            const data = doc.data();
            console.log(`📅 ${data.date}: ${data.keywords ? Object.keys(data.keywords).length : 0} products`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDailyStructure();