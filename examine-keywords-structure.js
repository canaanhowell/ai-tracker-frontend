#!/usr/bin/env node

/**
 * Examine the EXACT keywords structure in Firebase
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert('./ai-tracker-466821-892ecf5150a3.json'),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function examineKeywordsStructure() {
    console.log('🔍 Examining EXACT keywords field structure...\n');
    
    try {
        // 1. Check ai_coding_agents time_windows structure
        console.log('📊 AI_CODING_AGENTS time_windows/30_days:');
        const aiCodingDoc = await db
            .collection('all_categories')
            .doc('ai_coding_agents')
            .collection('time_windows')
            .doc('30_days')
            .get();
            
        if (aiCodingDoc.exists) {
            const data = aiCodingDoc.data();
            console.log('Full document data:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.keywords) {
                console.log('\n🔍 Keywords field detailed analysis:');
                Object.entries(data.keywords).forEach(([key, value]) => {
                    console.log(`\nKey: "${key}"`);
                    console.log('Value:', JSON.stringify(value, null, 2));
                });
            }
        }
        
        // 2. Check ai_chatbots for comparison
        console.log('\n\n📊 AI_CHATBOTS time_windows/30_days:');
        const aiChatbotsDoc = await db
            .collection('all_categories')
            .doc('ai_chatbots')
            .collection('time_windows')
            .doc('30_days')
            .get();
            
        if (aiChatbotsDoc.exists) {
            const data = aiChatbotsDoc.data();
            
            if (data.keywords) {
                console.log('Keywords field in ai_chatbots:');
                Object.entries(data.keywords).forEach(([key, value]) => {
                    console.log(`\nKey: "${key}"`);
                    console.log('Value:', JSON.stringify(value, null, 2));
                });
            }
        }
        
        // 3. Check daily structure too
        console.log('\n\n📊 AI_CODING_AGENTS daily structure:');
        const dailyDoc = await db
            .collection('all_categories')
            .doc('ai_coding_agents')
            .collection('30_days_daily')
            .orderBy('date', 'desc')
            .limit(1)
            .get();
            
        if (!dailyDoc.empty) {
            const doc = dailyDoc.docs[0];
            const data = doc.data();
            console.log(`\nDaily document (${doc.id}):`);
            console.log(JSON.stringify(data, null, 2));
        }
        
        // 4. Check keywords field in daily data
        if (!dailyDoc.empty) {
            const doc = dailyDoc.docs[0];
            const data = doc.data();
            if (data.keywords) {
                console.log('\n🔍 Daily keywords field:');
                Object.entries(data.keywords).forEach(([key, value]) => {
                    console.log(`\nDaily Key: "${key}"`);
                    console.log('Daily Value:', JSON.stringify(value, null, 2));
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

examineKeywordsStructure()
    .then(() => {
        console.log('\n✅ Examination completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Examination failed:', error);
        process.exit(1);
    });