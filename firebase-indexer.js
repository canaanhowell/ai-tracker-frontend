const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK using service account file
try {
  // Try to use service account file if it exists
  admin.initializeApp({
    credential: admin.credential.cert('./ai-tracker-466821-892ecf5150a3.json')
  });
  console.log('✅ Firebase initialized with service account file');
} catch (error) {
  // Fallback to project ID only (read-only access)
  console.log('⚠️ Service account file not found, using project ID only');
  admin.initializeApp({
    projectId: 'ai-tracker-466821'
  });
}

const db = admin.firestore();

async function indexAllCategories() {
  console.log('🔍 Starting Firebase all_categories collection indexing...\n');
  
  try {
    const allCategoriesRef = db.collection('all_categories');
    const snapshot = await allCategoriesRef.get();
    
    console.log(`📊 Found ${snapshot.size} documents in all_categories collection\n`);
    
    const structure = {};
    
    for (const doc of snapshot.docs) {
      const categoryId = doc.id;
      console.log(`📂 Category: ${categoryId}`);
      
      structure[categoryId] = {
        documentId: categoryId,
        data: doc.data(),
        subcollections: {}
      };
      
      // Get all subcollections for this document
      const subcollections = await doc.ref.listCollections();
      
      for (const subcollection of subcollections) {
        const subcollectionName = subcollection.id;
        console.log(`  📁 Subcollection: ${subcollectionName}`);
        
        structure[categoryId].subcollections[subcollectionName] = {
          documents: {}
        };
        
        // Get documents in this subcollection
        const subSnapshot = await subcollection.get();
        console.log(`    📄 Documents in ${subcollectionName}: ${subSnapshot.size}`);
        
        for (const subDoc of subSnapshot.docs) {
          const docData = subDoc.data();
          structure[categoryId].subcollections[subcollectionName].documents[subDoc.id] = {
            data: docData,
            fields: Object.keys(docData),
            sampleData: docData
          };
          
          console.log(`      🔸 ${subDoc.id}: ${Object.keys(docData).join(', ')}`);
          
          // Show sample values for first few fields
          const sampleFields = Object.keys(docData).slice(0, 3);
          for (const field of sampleFields) {
            const value = docData[field];
            const displayValue = typeof value === 'object' ? '[Object]' : 
                               Array.isArray(value) ? `[Array(${value.length})]` : 
                               String(value).length > 50 ? String(value).substring(0, 50) + '...' : 
                               value;
            console.log(`        • ${field}: ${displayValue}`);
          }
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Generate summary
    console.log('📋 COLLECTION STRUCTURE SUMMARY:');
    console.log('================================');
    
    for (const [categoryId, categoryData] of Object.entries(structure)) {
      console.log(`\n${categoryId}:`);
      console.log(`  Main document fields: ${Object.keys(categoryData.data).join(', ')}`);
      
      for (const [subName, subData] of Object.entries(categoryData.subcollections)) {
        console.log(`  ${subName}/:`);
        const allFields = new Set();
        Object.values(subData.documents).forEach(doc => {
          doc.fields.forEach(field => allFields.add(field));
        });
        console.log(`    Fields across all docs: ${Array.from(allFields).join(', ')}`);
        console.log(`    Document count: ${Object.keys(subData.documents).length}`);
      }
    }
    
    return structure;
    
  } catch (error) {
    console.error('❌ Error indexing collection:', error);
    throw error;
  }
}

// Run the indexing
indexAllCategories()
  .then(structure => {
    console.log('\n✅ Indexing complete!');
    console.log(`\n💾 Writing structure to firebase-structure.json...`);
    
    // Write full structure to JSON file for reference
    require('fs').writeFileSync(
      './firebase-structure.json', 
      JSON.stringify(structure, null, 2)
    );
    
    console.log('📁 Structure saved to firebase-structure.json');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Indexing failed:', error);
    process.exit(1);
  });