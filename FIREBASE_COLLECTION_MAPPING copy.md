# Firebase Collection Structure - Comprehensive Mapping

## Overview

The Firebase `all_categories` collection contains aggregated data for different AI tool categories. Each category document has two types of subcollections for historical data and time-window aggregations.

## Collection Structure

```
all_categories/
├── {category_id}/                    # e.g., "ai_chatbots", "ai_coding_agents", "all_categories"
│   ├── time_windows/                 # Aggregated data for time periods
│   │   ├── 7_days/                  # 7-day aggregated totals
│   │   ├── 30_days/                 # 30-day aggregated totals
│   │   └── 90_days/                 # 90-day aggregated totals
│   ├── 7_days_daily/                # Daily historical data for 7-day period
│   ├── 30_days_daily/               # Daily historical data for 30-day period
│   └── 90_days_daily/               # Daily historical data for 90-day period
```

## Data Structure Details

### 1. Time Windows Documents (`time_windows/{period}_days`)

These contain **aggregated totals** for the entire time period:

```javascript
{
  "window": "30_days",                    // Time period identifier
  "last_updated": Timestamp,              // When last updated
  "keyword_count": 5,                     // Number of keywords tracked
  "updated_by": "update_all_categories_timewindows_top5",
  "keywords": [                           // ARRAY of top products (ranked by score)
    {
      "keyword": "chatgpt",              // Product/tool name
      "combined_score": 11410,           // Total combined score for period
      "reddit_post_count": 11410,       // Total Reddit posts for period
      "youtube_video_count": 0,          // Total YouTube videos for period
      "velocity": 1821,                 // Growth velocity metric
      "acceleration": -7768              // Growth acceleration metric
    },
    // ... more products, ranked by combined_score
  ]
}
```

**Important Notes:**
- `keywords` is an **array**, not an object
- Products are ranked by `combined_score` (highest first)
- Contains **totals** for the entire time period
- Numeric array indices (0, 1, 2, ...) when accessed as object keys

### 2. Daily Documents (`{period}_days_daily/{date}`)

These contain **daily snapshot data** for chart generation:

```javascript
{
  "date": "2025-08-07",                   // Document ID and date field
  "timestamp": Timestamp,                 // When document was created
  "all": {                               // Aggregated totals for all keywords in this category
    "keyword": "all",                    // Identifier for aggregated data
    "combined_score": 8261.6,            // Daily total combined score
    "reddit_post_count": 15576,          // Daily total Reddit posts
    "youtube_video_count": 6704,         // Daily total YouTube videos
    "velocity": 323,                     // Daily velocity metric
    "acceleration": 100                  // Daily acceleration metric
  },
  "keywords": [                          // ARRAY of individual keyword data for this day
    {
      "keyword": "chatgpt",              // Product name
      "reddit_post_count": 12396,       // Daily Reddit posts for this product
      "youtube_video_count": 4448,      // Daily YouTube videos for this product
      "combined_score": 8844,            // Daily combined score for this product
      "velocity": 143.2,                // Daily velocity for this product
      "acceleration": 100                // Daily acceleration for this product
    },
    // ... more products for this date
  ]
}
```

**Important Notes:**
- `keywords` is an **array**, not an object
- Contains daily values (not cumulative totals)
- `all` field contains the sum of all keywords for that day
- Documents are ordered by date (newest first when queried with `orderBy('date', 'desc')`)

## Data Access Patterns

### 1. For Rankings Page (Current Totals)

**Correct Path:** `all_categories/{category}/time_windows/{period}_days`

```javascript
// Get 30-day aggregated rankings for AI chatbots
const doc = await db.collection('all_categories')
  .doc('ai_chatbots')
  .collection('time_windows')
  .doc('30_days')
  .get();

const data = doc.data();
const products = data.keywords; // This is an ARRAY

// Extract product data
products.forEach((product, index) => {
  console.log(`Rank ${index + 1}: ${product.keyword}`);
  console.log(`Score: ${product.combined_score}`);
  console.log(`Reddit: ${product.reddit_post_count}`);
  console.log(`YouTube: ${product.youtube_video_count}`);
});
```

### 2. For Historical Charts (Daily Data)

**Correct Path:** `all_categories/{category}/{period}_days_daily/`

```javascript
// Get last 7 days of data for charts
const snapshot = await db.collection('all_categories')
  .doc('ai_chatbots')
  .collection('30_days_daily')
  .orderBy('date', 'desc')
  .limit(7)
  .get();

snapshot.docs.reverse().forEach(doc => {
  const data = doc.data();
  console.log(`Date: ${data.date}`);
  
  // Find specific product data
  const chatgptData = data.keywords.find(k => k.keyword === 'chatgpt');
  if (chatgptData) {
    console.log(`ChatGPT score: ${chatgptData.combined_score}`);
  }
});
```

## Platform-Specific Scoring

### All Platforms (`platform = 'all'`)
Use: `product.combined_score`

### Reddit Only (`platform = 'reddit'`)  
Use: `product.reddit_post_count`

### YouTube Only (`platform = 'youtube'`)
Use: `product.youtube_video_count`

## Common Mistakes in Previous Implementation

1. ❌ **Wrong Field Name**: Looking for `data.keywords` as object instead of array
2. ❌ **Wrong Field Access**: Using `product.name` instead of `product.keyword`
3. ❌ **Wrong Structure**: Expecting `data.all` to contain product list instead of aggregated totals
4. ❌ **Wrong Collection**: Using daily collections for current rankings instead of time_windows
5. ❌ **Missing Array Handling**: Not recognizing that `keywords` is an array, not an object with string keys

## Correct Implementation Examples

### Extract Rankings for Display

```javascript
function extractAndRankProducts(data, platform) {
    const products = [];
    
    // keywords is an ARRAY, not an object
    if (data.keywords && Array.isArray(data.keywords)) {
        data.keywords.forEach((product, index) => {
            let score = 0;
            
            switch (platform) {
                case 'reddit':
                    score = product.reddit_post_count || 0;
                    break;
                case 'youtube':
                    score = product.youtube_video_count || 0;
                    break;
                case 'all':
                default:
                    score = product.combined_score || 0;
                    break;
            }
            
            if (score > 0) {
                products.push({
                    rank: index + 1,  // Already ranked in Firebase
                    name: product.keyword,  // Use 'keyword', not 'name'
                    category: 'AI Tools',
                    score: score,
                    velocity: product.velocity || 0,
                    acceleration: product.acceleration || 0
                });
            }
        });
    }
    
    return products;
}
```

### Extract Daily Data for Charts

```javascript
async function fetchDailyData(productName, timeWindow, category, platform) {
    const subcollection = `${timeWindow}_days_daily`;
    const numPoints = timeWindow === '7' ? 7 : timeWindow === '30' ? 5 : 4;
    
    const snapshot = await db
        .collection('all_categories')
        .doc(category === 'all_categories' ? 'all_categories' : category)
        .collection(subcollection)
        .orderBy('date', 'desc')
        .limit(numPoints)
        .get();
    
    const dailyValues = [];
    const docs = snapshot.docs.reverse(); // Oldest to newest for chart
    
    for (const doc of docs) {
        const data = doc.data();
        let value = 0;
        
        // Find product in keywords ARRAY
        if (data.keywords && Array.isArray(data.keywords)) {
            const product = data.keywords.find(k => 
                k.keyword && k.keyword.toLowerCase() === productName.toLowerCase()
            );
            
            if (product) {
                if (platform === 'reddit') {
                    value = product.reddit_post_count || 0;
                } else if (platform === 'youtube') {
                    value = product.youtube_video_count || 0;
                } else {
                    value = product.combined_score || 0;
                }
            }
        }
        
        dailyValues.push(value);
    }
    
    return dailyValues;
}
```

## Categories Available

Based on the Firebase collection scan:
- `ai_chatbots` - ChatGPT, Claude, etc.
- `ai_coding_agents` - Cursor, Codex, etc. 
- `ai_companions` - AI companion tools
- `ai_media_generation` - AI media generation tools
- `ai_models` - AI model platforms
- `all_categories` - Aggregated data across all categories
- `automation` - Automation tools
- `devices` - Hardware devices
- `general_ai` - General AI tools
- `health_and_fitness` - Health/fitness AI tools
- `marketing` - Marketing AI tools
- `productivity` - Productivity tools
- `robots` - Robotics
- `social_media` - Social media tools
- `website_builder` - Website building tools

## Time Windows Available
- `7_days` - 7-day period data
- `30_days` - 30-day period data  
- `90_days` - 90-day period data

This structure provides both current rankings (from time_windows) and historical data (from daily collections) needed for a complete dashboard experience.