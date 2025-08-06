# Data Normalization Documentation

## Overview
This document describes the centralized data normalization system implemented in the frontend dashboard to handle various Firebase data structures consistently.

## Problem Statement
Firebase data was arriving in multiple formats:
1. **Array format**: `[productName, metricsObject]`
2. **Indexed object format**: `{"0": {metrics}, "1": {metrics}}`
3. **Direct object format**: `{"productName": {metrics}}`
4. **Mixed formats** with product names in different fields

Additionally, categories were showing invalid values like "All Categories" and "All Reddit".

## Solution Architecture

### Centralized Normalization Function
The `normalizeFirebaseEntry(key, value, sourceCategory)` function handles all data structure variations:

```javascript
normalizeFirebaseEntry(key, value, sourceCategory = null) {
    // Returns: { name, category, metrics } or null
}
```

### Key Features

1. **Array Detection and Handling**
   - Detects `[productName, metrics]` structure
   - Extracts product name from array[0]
   - Uses array[1] as metrics object

2. **Indexed Entry Detection**
   - Identifies numeric keys ("0", "1", "2")
   - Searches for actual name in metrics.name, metrics.product_name, or metrics.productName
   - Falls back to key if no name field found

3. **Product Name Validation**
   - Filters out invalid names: "all", "total", "summary", etc.
   - Rejects numeric-only product names
   - Returns null for invalid entries

4. **Category Validation and Cleaning**
   - Maintains list of invalid categories
   - Validates categories before assignment
   - Cleans category names (capitalizes, removes underscores)
   - Falls back to source category or "trending"

### Data Flow

1. **Firebase Data** → 
2. **normalizeFirebaseEntry()** → 
3. **Validation** → 
4. **Clean Output** → 
5. **UI Display**

### Benefits

1. **Consistency**: All data sources use same normalization
2. **Maintainability**: Single point of change for data handling
3. **Robustness**: Handles edge cases and malformed data
4. **Performance**: Minimal overhead with early returns
5. **Debugging**: Clear logging for data transformation

## Usage Examples

### Combined Data Fetch
```javascript
Object.entries(timeWindowData).forEach(([keyword, value]) => {
    const normalized = this.normalizeFirebaseEntry(keyword, value, categoryName);
    if (normalized) {
        allData[normalized.name] = {
            ...normalized.metrics,
            category: normalized.category
        };
    }
});
```

### Reddit/YouTube Data
```javascript
const items = Object.entries(windowData)
    .map(([key, value]) => {
        const normalized = this.normalizeFirebaseEntry(key, value, category);
        if (!normalized) return null;
        // Process normalized data...
    })
    .filter(item => item !== null);
```

## Invalid Values Lists

### Invalid Categories
- all categories, all reddit, all youtube
- reddit, youtube, trending
- combined, aggregated, summary
- total, misc, other, unknown

### Invalid Product Names
- all, total, summary
- aggregated, combined
- misc, other, unknown
- Numeric-only names (0, 1, 2, etc.)

## Future Improvements

1. **Type Definitions**: Add TypeScript interfaces for normalized data
2. **Configuration**: Move invalid lists to configuration
3. **Caching**: Cache normalization results for repeated entries
4. **Analytics**: Track data structure variations for backend improvements