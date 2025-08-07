#!/usr/bin/env node

/**
 * Inspect the actual data structure to understand the format
 */

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert('./ai-tracker-466821-892ecf5150a3.json'),
  projectId: 'ai-tracker-466821'
});

const db = admin.firestore();

async function inspectData() {
  console.log('🔍 Inspecting actual Firebase data structure...\n');
  
  try {
    // Get the latest data
    const snapshot = await db
      .collection('all_categories')
      .doc('all_categories')
      .collection('30_days_daily')
      .orderBy('date', 'desc')
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      console.log(`📅 Document date: ${data.date}`);
      console.log(`🗂️ Top-level fields: ${Object.keys(data).join(', ')}\n`);
      
      if (data.all && typeof data.all === 'object') {
        console.log('📦 Contents of "all" field:');
        const allEntries = Object.entries(data.all);
        console.log(`   Found ${allEntries.length} entries\n`);
        
        // Show first few entries in detail
        allEntries.slice(0, 3).forEach(([key, value], index) => {
          console.log(`${index + 1}. Key: "${key}"`);
          console.log(`   Type: ${typeof value}`);
          
          if (typeof value === 'object' && value !== null) {
            console.log(`   Fields: ${Object.keys(value).join(', ')}`);
            
            // Show the actual values
            const sampleFields = Object.entries(value).slice(0, 5);
            sampleFields.forEach(([field, fieldValue]) => {
              console.log(`   - ${field}: ${fieldValue} (${typeof fieldValue})`);
            });
          } else {
            console.log(`   Value: ${value}`);
          }
          console.log('');
        });
        
        // Look for actual product data
        console.log('🔍 Looking for actual product entries...');
        const productLikeEntries = allEntries.filter(([key, value]) => 
          typeof value === 'object' && 
          value !== null && 
          (value.name || value.combined_score || value.reddit_post_count || value.youtube_video_count)
        );
        
        console.log(`Found ${productLikeEntries.length} product-like entries:`);
        productLikeEntries.slice(0, 3).forEach(([key, product]) => {
          console.log(`📱 Product: "${key}"`);
          console.log(`   Name: ${product.name || 'N/A'}`);
          console.log(`   Combined Score: ${product.combined_score || 'N/A'}`);
          console.log(`   Reddit Posts: ${product.reddit_post_count || 'N/A'}`);
          console.log(`   YouTube Videos: ${product.youtube_video_count || 'N/A'}`);
          console.log(`   Category: ${product.category || 'N/A'}`);
          console.log('');
        });
        
        if (productLikeEntries.length === 0) {
          console.log('❌ No recognizable product entries found');
          console.log('📄 Full structure of first entry:');
          const [firstKey, firstValue] = allEntries[0];
          console.log(`Key: ${firstKey}`);
          console.log('Value:', JSON.stringify(firstValue, null, 2));
        }
      }
    } else {
      console.log('❌ No data found');
    }
    
  } catch (error) {
    console.error('❌ Error inspecting data:', error);
  }
}

inspectData()
  .then(() => {
    console.log('✅ Inspection completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Inspection failed:', error);
    process.exit(1);
  });