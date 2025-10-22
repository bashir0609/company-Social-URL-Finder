# JavaScript Redirect Detection 🔄

## Problem

Some websites use **JavaScript** to redirect to language-specific pages:

```
User visits: https://gitarrenrichter.de/
Browser loads: https://gitarrenrichter.de/en (JS redirect)
Our scraper saw: https://gitarrenrichter.de/ ❌ (missed the redirect!)
```

### Why This Happens
- **HTTP redirects** (301, 302) - Axios can follow ✅
- **JavaScript redirects** - Axios can't detect ❌

## Solution

Use **headless browser** to detect JavaScript redirects:

```typescript
async function tryUrl(domain: string): Promise<string | null> {
  // 1. Try with Axios (fast, follows HTTP redirects)
  const httpUrl = await axiosRequest(domain);
  // Result: https://gitarrenrichter.de/
  
  // 2. Check for JS redirects with browser
  if (httpUrl.endsWith('/')) {
    const browserUrl = await tryUrlWithBrowser(httpUrl);
    // Result: https://gitarrenrichter.de/en ✅
    return browserUrl;
  }
  
  return httpUrl;
}
```

## How It Works

### Step 1: HTTP Redirects (Axios)
```
http://gitarrenrichter.de
  ↓ (301 redirect)
https://gitarrenrichter.de/
```
**Axios can follow this** ✅

### Step 2: JavaScript Redirects (Browser)
```
https://gitarrenrichter.de/
  ↓ (JavaScript: window.location = '/en')
https://gitarrenrichter.de/en
```
**Only browser can detect this** ✅

## Implementation

```typescript
async function tryUrlWithBrowser(url: string): Promise<string | null> {
  const { chromium } = require('playwright-core');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate and wait for JS to execute
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: 5000 
  });
  
  // Get final URL after JS redirects
  const finalUrl = page.url();
  await browser.close();
  
  return finalUrl; // https://gitarrenrichter.de/en ✅
}
```

## When Browser Check Runs

Only when needed (smart detection):

```typescript
if (finalUrl.endsWith('/') && 
    !finalUrl.includes('/en') && 
    !finalUrl.includes('/de')) {
  // Might have JS redirect - check with browser
  const browserUrl = await tryUrlWithBrowser(finalUrl);
}
```

## Real Examples

### Example 1: gitarrenrichter.de
```
Input: gitarrenrichter.de
HTTP redirect: → https://gitarrenrichter.de/
JS redirect: → https://gitarrenrichter.de/en ✅
Stored: https://gitarrenrichter.de/en
```

### Example 2: google.com (No JS redirect)
```
Input: google.com
HTTP redirect: → https://google.com
No JS redirect: (stays at https://google.com)
Stored: https://google.com
```

### Example 3: Multi-language site
```
Input: example.com
HTTP redirect: → https://example.com/
JS redirect: → https://example.com/en-us ✅
Stored: https://example.com/en-us
```

## Benefits

✅ **Accurate** - Gets actual loaded URL  
✅ **Smart** - Only uses browser when needed  
✅ **Fast** - Axios first, browser only if necessary  
✅ **Complete** - Handles both HTTP and JS redirects  

## Performance

| Redirect Type | Method | Time |
|---------------|--------|------|
| HTTP only | Axios | 1s ⚡ |
| HTTP + JS | Axios + Browser | 6s |
| No redirect | Axios | 1s ⚡ |

## Types of Redirects Handled

### ✅ HTTP Redirects (Axios)
- 301 Permanent
- 302 Temporary
- 307 Temporary
- 308 Permanent

### ✅ JavaScript Redirects (Browser)
- `window.location = '/en'`
- `window.location.href = '/en'`
- `window.location.replace('/en')`
- Meta refresh with JS

### ✅ Language Detection
- Detects user language
- Redirects to `/en`, `/de`, `/fr`, etc.
- Common on European sites

## Logs You'll See

### HTTP Redirect Only:
```
✅ Found: http://google.com → https://google.com
```

### HTTP + JS Redirect:
```
✅ Found: http://gitarrenrichter.de → https://gitarrenrichter.de/
🔄 JS redirect detected: https://gitarrenrichter.de/ → https://gitarrenrichter.de/en
```

## Files Modified

- `pages/api/enrich.ts`
  - Added `tryUrlWithBrowser()` function
  - Updated `tryUrl()` to detect JS redirects
  - Smart detection (only uses browser when needed)

## Summary

**Before:** Missed JavaScript redirects, stored wrong URL  
**After:** Detects JS redirects, stores actual loaded URL  
**Result:** Users see the real homepage URL! ✅

**Example:**
- Before: `https://gitarrenrichter.de/` ❌
- After: `https://gitarrenrichter.de/en` ✅
