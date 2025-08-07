#!/usr/bin/env node

/**
 * Search for where individual product data might be stored
 */

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert('./ai-tracker-466821-892ecf5150a3.json'),
  projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function findProductData() {
  console.log('🔍 Searching for individual product data...\n');
  
  try {
    // 1. Check if products are in the main document fields
    console.log('1️⃣ Checking main document fields...');
    const doc = await db.collection('all_categories').doc('all_categories').get();
    if (doc.exists) {
      const data = doc.data();
      console.log('Main document fields:', Object.keys(data));
      
      // Look for any field that might contain products
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          console.log(`\n📦 Field "${key}" contains object with ${Object.keys(value).length} keys:`);
          const sampleKeys = Object.keys(value).slice(0, 5);
          console.log(`   Sample keys: ${sampleKeys.join(', ')}`);
          
          // Check if any of these look like product names
          const productLikeKeys = sampleKeys.filter(k => 
            !['acceleration', 'velocity', 'combined_score', 'reddit_post_count'].includes(k) &&
            k.length > 2
          );
          
          if (productLikeKeys.length > 0) {
            console.log(`   🎯 Potential product keys: ${productLikeKeys.join(', ')}`);
            
            // Inspect one of these
            const sampleProduct = value[productLikeKeys[0]];
            console.log(`   Sample value for "${productLikeKeys[0]}":`, 
              typeof sampleProduct === 'object' ? Object.keys(sampleProduct) : sampleProduct
            );
          }
        }
      }
    }
    
    // 2. Check the keywords field in daily data
    console.log('\n2️⃣ Checking keywords field in daily data...');
    const dailySnapshot = await db
      .collection('all_categories')
      .doc('all_categories')
      .collection('30_days_daily')
      .orderBy('date', 'desc')
      .limit(1)
      .get();
    
    if (!dailySnapshot.empty) {
      const dailyData = dailySnapshot.docs[0].data();
      
      if (dailyData.keywords && typeof dailyData.keywords === 'object') {
        console.log(`📝 Keywords field contains ${Object.keys(dailyData.keywords).length} entries`);
        
        const keywordEntries = Object.entries(dailyData.keywords);
        const sampleEntries = keywordEntries.slice(0, 3);
        
        sampleEntries.forEach(([key, value]) => {
          console.log(`\n🔑 Keyword: "${key}"`);
          if (typeof value === 'object' && value !== null) {
            console.log(`   Fields: ${Object.keys(value).join(', ')}`);
            
            // Check if this looks like product data
            const hasProductFields = ['name', 'combined_score', 'reddit_post_count', 'category'].some(
              field => value.hasOwnProperty(field)
            );
            
            if (hasProductFields) {
              console.log('   🎯 This looks like product data!');
              console.log(`   Name: ${value.name || 'N/A'}`);
              console.log(`   Combined Score: ${value.combined_score || 'N/A'}`);
              console.log(`   Reddit Posts: ${value.reddit_post_count || 'N/A'}`);
              console.log(`   Category: ${value.category || 'N/A'}`);
            }
          } else {
            console.log(`   Value: ${value} (${typeof value})`);
          }
        });
      }
    }
    
    // 3. Check time_windows subcollection
    console.log('\n3️⃣ Checking time_windows subcollection...');
    const timeWindowsSnapshot = await db
      .collection('all_categories')
      .doc('all_categories')
      .collection('time_windows')
      .limit(5)
      .get();
    
    console.log(`Found ${timeWindowsSnapshot.size} documents in time_windows`);
    timeWindowsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📄 Document "${doc.id}": ${Object.keys(data).join(', ')}`);
    });
    
    // 4. Check a specific product category like ai_chatbots
    console.log('\n4️⃣ Checking ai_chatbots category...');
    const chatbotsSnapshot = await db
      .collection('all_categories')
      .doc('ai_chatbots')
      .collection('30_days_daily')
      .orderBy('date', 'desc')
      .limit(1)
      .get();
    
    if (!chatbotsSnapshot.empty) {
      const chatbotsData = chatbotsSnapshot.docs[0].data();
      console.log('ai_chatbots fields:', Object.keys(chatbotsData));
      
      if (chatbotsData.keywords) {
        console.log(`ai_chatbots keywords: ${Object.keys(chatbotsData.keywords).length} entries`);
        const firstKeyword = Object.entries(chatbotsData.keywords)[0];
        if (firstKeyword) {
          console.log(`Sample keyword: ${firstKeyword[0]}`);
          if (typeof firstKeyword[1] === 'object') {
            console.log(`Fields: ${Object.keys(firstKeyword[1]).join(', ')}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error searching for product data:', error);
  }
}

findProductData()
  .then(() => {
    console.log('\n✅ Search completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Search failed:', error);
    process.exit(1);
  });