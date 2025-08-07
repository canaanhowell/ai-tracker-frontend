#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./ai-tracker-466821-892ecf5150a3.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function thoroughIndex() {
    try {
        console.log('🔍 THOROUGH INDEX OF ALL_CATEGORIES COLLECTION');
        console.log('================================================\n');
        
        // 1. Get all documents in all_categories
        const collectionSnapshot = await db.collection('all_categories').get();
        console.log(`📂 Found ${collectionSnapshot.docs.length} documents in all_categories:\n`);
        
        for (const doc of collectionSnapshot.docs) {
            console.log(`📄 Document: ${doc.id}`);
            const data = doc.data();
            console.log(`   Fields: ${Object.keys(data).join(', ')}`);
            
            // Check for subcollections
            const collections = await doc.ref.listCollections();
            if (collections.length > 0) {
                console.log(`   Subcollections: ${collections.map(c => c.id).join(', ')}`);
                
                // Dive into each subcollection
                for (const subcol of collections) {
                    const subDocs = await subcol.limit(5).get();
                    console.log(`     📁 ${subcol.id}: ${subDocs.docs.length} docs`);
                    
                    if (subDocs.docs.length > 0) {
                        const firstDoc = subDocs.docs[0];
                        const firstData = firstDoc.data();
                        console.log(`       📋 Sample doc (${firstDoc.id}): ${Object.keys(firstData).join(', ')}`);
                        
                        // If it has keywords, check the structure
                        if (firstData.keywords) {
                            const productNames = Object.keys(firstData.keywords).slice(0, 3);
                            console.log(`       🔑 Sample products: ${productNames.join(', ')}`);
                            
                            if (productNames.length > 0) {
                                const sampleProduct = firstData.keywords[productNames[0]];
                                console.log(`       📊 Product fields: ${Object.keys(sampleProduct).join(', ')}`);
                                
                                // Check for historical/time-series data within products
                                const historicalKeys = Object.keys(sampleProduct).filter(key => 
                                    key.includes('historical') || key.includes('daily') || key.includes('trend') || 
                                    key.includes('time') || key.includes('series') || Array.isArray(sampleProduct[key])
                                );
                                if (historicalKeys.length > 0) {
                                    console.log(`       📈 Historical keys found: ${historicalKeys.join(', ')}`);
                                    historicalKeys.forEach(key => {
                                        console.log(`         ${key}: ${typeof sampleProduct[key]} (${Array.isArray(sampleProduct[key]) ? sampleProduct[key].length + ' items' : 'not array'})`);
                                    });
                                }
                            }
                        }
                    }
                }
            }
            console.log('');
        }
        
        // 2. Specifically check the main all_categories document structure
        console.log('🎯 DEEP DIVE INTO MAIN DOCUMENTS');
        console.log('=================================\n');
        
        const mainDoc = await db.collection('all_categories').doc('all_categories').get();
        if (mainDoc.exists) {
            const data = mainDoc.data();
            console.log('📋 all_categories document fields:', Object.keys(data));
            
            // Check time window fields
            const timeFields = ['7_days', '30_days', '90_days'];
            timeFields.forEach(field => {
                if (data[field]) {
                    console.log(`\n🕐 ${field} structure:`, typeof data[field]);
                    if (typeof data[field] === 'object') {
                        console.log(`   Keys: ${Object.keys(data[field]).join(', ')}`);
                        
                        // If it contains products, check their structure
                        const firstKey = Object.keys(data[field])[0];
                        if (firstKey && typeof data[field][firstKey] === 'object') {
                            console.log(`   Sample item (${firstKey}):`, Object.keys(data[field][firstKey]).join(', '));
                        }
                    }
                }
            });
        }
        
        // 3. Check for any time-series patterns in document IDs or data
        console.log('\n📅 LOOKING FOR TIME-SERIES PATTERNS');
        console.log('===================================\n');
        
        // Check if there are date-named documents
        const potentialDates = collectionSnapshot.docs.map(d => d.id).filter(id => 
            id.match(/\d{4}-\d{2}-\d{2}/) || id.includes('daily') || id.includes('historical')
        );
        
        if (potentialDates.length > 0) {
            console.log('📅 Found potential date/historical documents:', potentialDates.join(', '));
        }
        
        console.log('\n✅ THOROUGH INDEX COMPLETE');
        
    } catch (error) {
        console.error('❌ Error during thorough index:', error);
    }
}

thoroughIndex();