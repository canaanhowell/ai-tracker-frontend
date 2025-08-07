#!/usr/bin/env node

/**
 * Debug script to inspect Firebase data structure
 * This will help us understand why we're getting empty data
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase
try {
  admin.initializeApp({
    credential: admin.credential.cert('./ai-tracker-466821-892ecf5150a3.json'),
    projectId: 'ai-tracker-466821'
  });
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.log('⚠️ Service account file not found, using project ID only');
  admin.initializeApp({
    projectId: 'ai-tracker-466821'
  });
}

const db = admin.firestore();

async function debugFirebase() {
  console.log('🔍 Starting Firebase data quality investigation...\n');
  
  try {
    // 1. Check all_categories collection structure
    console.log('📂 Checking all_categories collection...');
    const allCategoriesRef = db.collection('all_categories');
    const allCategoriesSnapshot = await allCategoriesRef.get();
    
    console.log(`Found ${allCategoriesSnapshot.size} documents in all_categories:`);
    allCategoriesSnapshot.docs.forEach(doc => {
      console.log(`  - ${doc.id}`);
    });
    
    // 2. Investigate all_categories aggregated data for duplicates
    console.log('\n🔍 INVESTIGATING ALL_CATEGORIES AGGREGATED DATA...');
    console.log('================================================');
    
    const allCategoriesDoc = await db.collection('all_categories').doc('all_categories').get();
    if (allCategoriesDoc.exists) {
      // Check time_windows structure first
      const timeWindowsRef = allCategoriesDoc.ref.collection('time_windows').doc('30_days');
      const timeWindowsDoc = await timeWindowsRef.get();
      
      if (timeWindowsDoc.exists) {
        const timeWindowsData = timeWindowsDoc.data();
        console.log('\n📊 ALL_CATEGORIES time_windows/30_days structure:');
        console.log('Document fields:', Object.keys(timeWindowsData));
        
        if (timeWindowsData.keywords) {
          console.log(`\n🔍 Keywords field analysis:`);
          console.log(`- Total keywords: ${Object.keys(timeWindowsData.keywords).length}`);
          
          // Look specifically for chatgpt duplicates
          const chatgptEntries = Object.entries(timeWindowsData.keywords).filter(([key, value]) => 
            key.toLowerCase().includes('chatgpt') || (value.name && value.name.toLowerCase().includes('chatgpt'))
          );
          
          console.log(`\n🚨 CHATGPT ENTRIES FOUND: ${chatgptEntries.length}`);
          chatgptEntries.forEach(([key, value], index) => {
            console.log(`  ${index + 1}. Key: "${key}"`);
            console.log(`     Name: "${value.name || 'N/A'}"`);
            console.log(`     Reddit posts: ${value.reddit_post_count || 0}`);
            console.log(`     YouTube videos: ${value.youtube_video_count || 0}`);
            console.log(`     Combined score: ${value.combined_score || 0}`);
            console.log(`     Keywords: ${JSON.stringify(value.keywords || [])}`);
            console.log(`     Categories: ${JSON.stringify(value.categories || [])}`);
            console.log(`     ---`);
          });
          
          // Check for artificial patterns
          const allEntries = Object.entries(timeWindowsData.keywords);
          const suspiciousPatterns = {
            duplicateNames: {},
            lowDataQuality: [],
            testEntries: []
          };
          
          allEntries.forEach(([key, value]) => {
            const name = value.name || key;
            
            // Track duplicate names
            if (!suspiciousPatterns.duplicateNames[name]) {
              suspiciousPatterns.duplicateNames[name] = [];
            }
            suspiciousPatterns.duplicateNames[name].push(key);
            
            // Check for low data quality
            if ((value.reddit_post_count || 0) === 0 && (value.youtube_video_count || 0) === 0) {
              suspiciousPatterns.lowDataQuality.push({key, name});
            }
            
            // Check for test-like entries
            if (name.toLowerCase().includes('test') || key.toLowerCase().includes('test') ||
                name.toLowerCase().includes('debug') || key.toLowerCase().includes('debug')) {
              suspiciousPatterns.testEntries.push({key, name});
            }
          });
          
          console.log(`\n🔍 DATA QUALITY ANALYSIS:`);
          
          const duplicates = Object.entries(suspiciousPatterns.duplicateNames)
            .filter(([name, keys]) => keys.length > 1);
          console.log(`- Duplicate names: ${duplicates.length}`);
          duplicates.slice(0, 10).forEach(([name, keys]) => {
            console.log(`  * "${name}": ${keys.join(', ')}`);
          });
          
          console.log(`- Zero-data entries: ${suspiciousPatterns.lowDataQuality.length}`);
          console.log(`- Test entries: ${suspiciousPatterns.testEntries.length}`);
          
          if (suspiciousPatterns.testEntries.length > 0) {
            console.log(`  Test entries found:`);
            suspiciousPatterns.testEntries.forEach(({key, name}) => {
              console.log(`    - Key: "${key}", Name: "${name}"`);
            });
          }
        }
      }
      
      // Also check the old 30_days_daily structure if it exists
      const subcollections = await allCategoriesDoc.ref.listCollections();
      console.log(`\n📁 Found subcollections: ${subcollections.map(s => s.id).join(', ')}`);
      
      if (subcollections.find(s => s.id === '30_days_daily')) {
        console.log('\n📊 INVESTIGATING 30_days_daily structure...');
        const dailySnapshot = await allCategoriesDoc.ref.collection('30_days_daily')
          .orderBy('date', 'desc')
          .limit(3)
          .get();
        
        console.log(`Found ${dailySnapshot.size} daily documents`);
        
        for (const doc of dailySnapshot.docs) {
          const data = doc.data();
          console.log(`\n📅 Date: ${doc.id}`);
          console.log(`   Fields: ${Object.keys(data).join(', ')}`);
          
          if (data.all && typeof data.all === 'object') {
            const allEntries = Object.entries(data.all);
            console.log(`   Total products in 'all': ${allEntries.length}`);
            
            // Look for ChatGPT entries
            const chatgptInDaily = allEntries.filter(([key, value]) => 
              key.toLowerCase().includes('chatgpt') || (value.name && value.name.toLowerCase().includes('chatgpt'))
            );
            console.log(`   ChatGPT entries found: ${chatgptInDaily.length}`);
            
            if (chatgptInDaily.length > 0) {
              console.log(`   🚨 CHATGPT ENTRIES DETAILS:`);
              chatgptInDaily.forEach(([key, value], index) => {
                console.log(`     ${index + 1}. Key: "${key}"`);
                console.log(`        Name: "${value.name || 'N/A'}"`);
                console.log(`        Reddit: ${value.reddit_post_count || 0}, YouTube: ${value.youtube_video_count || 0}`);
                console.log(`        Score: ${value.combined_score || 0}`);
                console.log(`        Keywords: ${JSON.stringify(value.keywords || [])}`);
                console.log(`        Categories: ${JSON.stringify(value.categories || [])}`);
              });
            }
            
            // Show some sample entries to understand data structure
            const sampleEntries = allEntries.slice(0, 10);
            console.log(`   📋 Sample entries:`);
            sampleEntries.forEach(([key, value], index) => {
              console.log(`     ${index + 1}. "${key}" -> "${value.name || 'N/A'}" (R:${value.reddit_post_count || 0} Y:${value.youtube_video_count || 0})`);
            });
            
            // Check for duplicates and quality issues
            const duplicateNames = {};
            const testEntries = [];
            const zeroDataEntries = [];
            
            allEntries.forEach(([key, value]) => {
              const name = value.name || key;
              
              if (!duplicateNames[name]) duplicateNames[name] = [];
              duplicateNames[name].push(key);
              
              if (name.toLowerCase().includes('test') || key.toLowerCase().includes('test') ||
                  name.toLowerCase().includes('debug') || key.toLowerCase().includes('debug')) {
                testEntries.push({key, name});
              }
              
              if ((value.reddit_post_count || 0) === 0 && (value.youtube_video_count || 0) === 0) {
                zeroDataEntries.push({key, name});
              }
            });
            
            const duplicates = Object.entries(duplicateNames).filter(([name, keys]) => keys.length > 1);
            console.log(`   🔍 QUALITY ANALYSIS for ${doc.id}:`);
            console.log(`     - Duplicate names: ${duplicates.length}`);
            console.log(`     - Test entries: ${testEntries.length}`);
            console.log(`     - Zero-data entries: ${zeroDataEntries.length}`);
            
            if (duplicates.length > 0) {
              console.log(`     🚨 Top duplicates:`);
              duplicates.slice(0, 5).forEach(([name, keys]) => {
                console.log(`       * "${name}": appears ${keys.length} times (${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`);
              });
            }
            
            if (testEntries.length > 0) {
              console.log(`     🔧 Test entries found:`);
              testEntries.slice(0, 3).forEach(({key, name}) => {
                console.log(`       - "${key}" -> "${name}"`);
              });
            }
          }
        }
      }
    }
    
    // 3. Compare with ai_coding_agents for quality baseline  
    console.log('\n\n🔍 COMPARING WITH AI_CODING_AGENTS (Quality Baseline)...');
    console.log('========================================================');
    
    const aiCodingAgentsDoc = await db.collection('all_categories').doc('ai_coding_agents').get();
    if (aiCodingAgentsDoc.exists) {
      // Check both time_windows and 30_days_daily
      console.log('\n📊 AI_CODING_AGENTS time_windows/30_days:');
      const timeWindowsRef = aiCodingAgentsDoc.ref.collection('time_windows').doc('30_days');
      const timeWindowsDoc = await timeWindowsRef.get();
      
      if (timeWindowsDoc.exists) {
        const timeWindowsData = timeWindowsDoc.data();
        console.log('Document fields:', Object.keys(timeWindowsData));
        
        if (timeWindowsData.keywords) {
          console.log(`Keywords: ${Object.keys(timeWindowsData.keywords).length} entries`);
          const sampleEntries = Object.entries(timeWindowsData.keywords).slice(0, 5);
          sampleEntries.forEach(([key, value], index) => {
            console.log(`  ${index + 1}. "${key}" -> Name: "${value.name || 'N/A'}", Reddit: ${value.reddit_post_count || 0}, YouTube: ${value.youtube_video_count || 0}`);
          });
        }
      }
      
      // Check 30_days_daily structure for this category
      const aiCodingSubcollections = await aiCodingAgentsDoc.ref.listCollections();
      if (aiCodingSubcollections.find(s => s.id === '30_days_daily')) {
        console.log('\n📊 AI_CODING_AGENTS 30_days_daily:');
        const dailySnapshot = await aiCodingAgentsDoc.ref.collection('30_days_daily')
          .orderBy('date', 'desc')
          .limit(1)
          .get();
        
        if (!dailySnapshot.empty) {
          const latestDoc = dailySnapshot.docs[0];
          const data = latestDoc.data();
          console.log(`Latest daily data (${latestDoc.id}):`, Object.keys(data));
          
          if (data.all && typeof data.all === 'object') {
            const allEntries = Object.entries(data.all);
            console.log(`Total products in 'all': ${allEntries.length}`);
            
            // Show sample entries to compare structure
            const sampleEntries = allEntries.slice(0, 10);
            console.log(`Sample entries:`);
            sampleEntries.forEach(([key, value], index) => {
              console.log(`  ${index + 1}. "${key}" -> "${value.name || 'N/A'}" (R:${value.reddit_post_count || 0} Y:${value.youtube_video_count || 0})`);
            });
            
            // Look for ChatGPT entries in this good category
            const chatgptInAiCoding = allEntries.filter(([key, value]) => 
              key.toLowerCase().includes('chatgpt') || (value.name && value.name.toLowerCase().includes('chatgpt'))
            );
            console.log(`ChatGPT entries in ai_coding_agents: ${chatgptInAiCoding.length}`);
            if (chatgptInAiCoding.length > 0) {
              chatgptInAiCoding.forEach(([key, value]) => {
                console.log(`  - "${key}" -> "${value.name || 'N/A'}" (R:${value.reddit_post_count || 0} Y:${value.youtube_video_count || 0})`);
              });
            }
          }
        }
      }
    }
    
    // 3b. Let's also check historical data in all_categories for older ChatGPT duplicates
    console.log('\n\n🔍 CHECKING HISTORICAL all_categories DATA...');
    console.log('===============================================');
    
    const olderDailySnapshot = await allCategoriesDoc.ref.collection('30_days_daily')
      .orderBy('date', 'desc')
      .limit(10)
      .get();
    
    console.log(`Found ${olderDailySnapshot.size} historical daily documents`);
    
    let foundChatGptData = false;
    for (const doc of olderDailySnapshot.docs) {
      const data = doc.data();
      if (data.all && typeof data.all === 'object') {
        const allEntries = Object.entries(data.all);
        
        // Check if this has real product data (not metadata fields)
        const hasRealProducts = allEntries.some(([key, value]) => 
          typeof value === 'object' && value.name && 
          !['acceleration', 'combined_score', 'velocity', 'keyword', 'reddit_post_count', 'youtube_video_count'].includes(key)
        );
        
        if (hasRealProducts) {
          console.log(`\n📅 Found real product data in ${doc.id}:`);
          console.log(`   Total products: ${allEntries.length}`);
          
          const chatgptEntries = allEntries.filter(([key, value]) => 
            key.toLowerCase().includes('chatgpt') || (value.name && value.name.toLowerCase().includes('chatgpt'))
          );
          
          if (chatgptEntries.length > 0) {
            foundChatGptData = true;
            console.log(`   🚨 CHATGPT ENTRIES FOUND: ${chatgptEntries.length}`);
            chatgptEntries.forEach(([key, value], index) => {
              console.log(`     ${index + 1}. Key: "${key}"`);
              console.log(`        Name: "${value.name || 'N/A'}"`);
              console.log(`        Reddit: ${value.reddit_post_count || 0}, YouTube: ${value.youtube_video_count || 0}`);
              console.log(`        Score: ${value.combined_score || 0}`);
              console.log(`        Keywords: ${JSON.stringify(value.keywords || [])}`);
              console.log(`        Categories: ${JSON.stringify(value.categories || [])}`);
            });
          }
          
          // Sample some entries for comparison
          const sampleEntries = allEntries.slice(0, 5);
          console.log(`   📋 Sample entries from ${doc.id}:`);
          sampleEntries.forEach(([key, value], index) => {
            console.log(`     ${index + 1}. "${key}" -> "${value.name || 'N/A'}" (R:${value.reddit_post_count || 0} Y:${value.youtube_video_count || 0})`);
          });
          
          break; // Found good data, no need to check more
        }
      }
    }
    
    if (!foundChatGptData) {
      console.log('\n❌ No ChatGPT duplicates found in recent historical data');
      console.log('   This suggests the issue might be in older data or different collections');
    }
    
    // 4. Check other specific categories for comparison
    console.log('\n\n🔍 CHECKING OTHER CATEGORIES FOR PATTERNS...');
    console.log('===============================================');
    
    const categoriesToCheck = ['ai_chatbots', 'general_ai', 'ai_media_generation'];
    
    for (const categoryId of categoriesToCheck) {
      const categoryDoc = await db.collection('all_categories').doc(categoryId).get();
      if (categoryDoc.exists) {
        const timeWindowsRef = categoryDoc.ref.collection('time_windows').doc('30_days');
        const timeWindowsDoc = await timeWindowsRef.get();
        
        if (timeWindowsDoc.exists) {
          const timeWindowsData = timeWindowsDoc.data();
          if (timeWindowsData.keywords) {
            const chatgptEntries = Object.entries(timeWindowsData.keywords).filter(([key, value]) => 
              key.toLowerCase().includes('chatgpt') || (value.name && value.name.toLowerCase().includes('chatgpt'))
            );
            
            console.log(`\n📊 ${categoryId.toUpperCase()}:`);
            console.log(`   Total keywords: ${Object.keys(timeWindowsData.keywords).length}`);
            console.log(`   ChatGPT entries: ${chatgptEntries.length}`);
            
            if (chatgptEntries.length > 0) {
              console.log(`   ChatGPT details:`);
              chatgptEntries.forEach(([key, value]) => {
                console.log(`     - "${key}" -> "${value.name || 'N/A'}" (R:${value.reddit_post_count || 0} Y:${value.youtube_video_count || 0})`);
              });
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

// Run debug
debugFirebase()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });