# Testing Guide - Enhanced Scraping

## Changes Made

### 1. Disabled Fast Mode
- **Before:** `fast_mode = true` (default)
- **After:** `fast_mode = false` (default)
- **Result:** Now uses enhanced extraction with headless browser

### 2. What This Means
The app will now:
- ✅ Use headless browser for JavaScript-heavy sites
- ✅ Extract social links from actual website content
- ✅ Scrape homepage + contact page
- ✅ Return only real, verified URLs

## How to Test

### Start the App
```bash
# Kill any running instances
taskkill /F /IM node.exe

# Start fresh
npm run dev
```

### Test Cases

#### 1. Test with a Simple Company
```
Input: "Nike"
Expected: 
- Finds nike.com
- Extracts social links from their website
- Returns LinkedIn, Twitter, Instagram, etc.
- Shows "🔍 STEP 3: Starting enhanced website extraction"
```

#### 2. Test with JavaScript-Heavy Site
```
Input: Any Wix website
Expected:
- Uses headless browser
- Extracts content after JavaScript loads
- Finds social links in footer
```

#### 3. Test with Direct URL
```
Input: "cordial-cables.com"
Expected:
- Scrapes the website
- Extracts social links
- NO fake/generated URLs
```

## What You Should See in Logs

### OLD (Fast Mode):
```
⚡ FAST MODE: Quick extraction from homepage only
⚡ FAST MODE: Found phone: 7446205343
```

### NEW (Enhanced Mode):
```
🔍 STEP 3: Starting enhanced website extraction (with headless browser)...
🔍 Starting enhanced extraction for: https://example.com
   Headless browser: ENABLED
📄 Scraping with axios: https://example.com
✅ Axios scraping successful
   Found 3 social links
📞 Found contact page: https://example.com/contact
```

## Expected Improvements

### Before (Fast Mode)
- ❌ Only scraped homepage
- ❌ Missed contact page data
- ❌ Didn't handle JS-heavy sites
- ❌ Limited social link extraction

### After (Enhanced Mode)
- ✅ Scrapes homepage + contact page
- ✅ Uses headless browser when needed
- ✅ Handles JavaScript-rendered content
- ✅ Better social link extraction
- ✅ Only returns real URLs found on site

## Files Modified

1. `pages/api/enrich.ts`
   - Line 1141: Changed `fast_mode = false`
   - Now uses `enhancedExtraction()` by default

2. `pages/index.tsx`
   - Line 408: Removed `fast_mode: true` from bulk processing

3. `pages/api/scraper.ts`
   - New module with headless browser support

## Troubleshooting

### If you still see "FAST MODE" in logs:
1. Stop the server completely
2. Clear any cached requests
3. Restart: `npm run dev`
4. Try a fresh search

### If headless browser fails:
- Falls back to axios automatically
- Check Chrome is installed
- See logs for fallback message

## Next Steps

1. ✅ Test with real companies
2. ✅ Verify social links are real (not generated)
3. ✅ Check headless browser works for JS sites
4. 🔄 When satisfied, push to production

## Summary

The app now uses **enhanced extraction with headless browser support** by default, providing:
- Better accuracy
- More data extraction
- Support for modern JavaScript websites
- Only real, verified social media URLs
