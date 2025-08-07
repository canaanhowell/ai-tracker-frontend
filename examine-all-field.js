#!/usr/bin/env node

/**
 * Examine the 'all' field structure in daily documents
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert('./ai-tracker-466821-892ecf5150a3.json'),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function examineAllField() {
    console.log('🔍 Examining the "all" field structure in daily documents...\n');
    
    try {
        // Check multiple categories to understand the 'all' field pattern
        const categories = ['ai_coding_agents', 'ai_chatbots', 'all_categories'];
        
        for (const category of categories) {
            console.log(`\n📊 ${category.toUpperCase()} daily "all" field:`);
            console.log('='.repeat(50));
            
            const dailySnapshot = await db
                .collection('all_categories')
                .doc(category)
                .collection('30_days_daily')
                .orderBy('date', 'desc')
                .limit(3)
                .get();
            
            if (!dailySnapshot.empty) {
                for (const doc of dailySnapshot.docs) {
                    const data = doc.data();
                    console.log(`\n📅 ${doc.id}:`);
                    
                    if (data.all) {
                        console.log('  "all" field structure:');
                        console.log(JSON.stringify(data.all, null, 4));
                    }
                    
                    if (data.keywords) {
                        console.log(`  Keywords count: ${Array.isArray(data.keywords) ? data.keywords.length : Object.keys(data.keywords).length}`);
                        if (Array.isArray(data.keywords)) {
                            console.log('  Top 3 keywords:');
                            data.keywords.slice(0, 3).forEach((keyword, index) => {
                                console.log(`    ${index}: ${keyword.keyword} (R:${keyword.reddit_post_count || 0}, Y:${keyword.youtube_video_count || 0})`);
                            });
                        }
                    }
                }
            } else {
                console.log('  No daily documents found');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

examineAllField()
    .then(() => {
        console.log('\n✅ Examination completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Examination failed:', error);
        process.exit(1);
    });