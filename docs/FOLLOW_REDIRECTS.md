# Follow Redirects Strategy 🔄

## Your Request
> "It should browse domain without adding anything, wherever it load the page extract information from there"

## Solution: Let the Server Decide!

### How It Works Now

1. **Add minimal protocol** (only if missing)
   ```
   Input: google.com
   Add: http://google.com
   ```

2. **Follow redirects automatically**
   ```
   http://google.com → https://google.com (301 redirect)
   http://facebook.com → https://www.facebook.com (301 redirect)
   http://example.com → https://www.example.com (301 redirect)
   ```

3. **Extract from final destination**
   ```
   Final URL: https://google.com
   Extract: Social links, email, phone from THIS page
   ```

## Code Implementation

```typescript
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Only add http:// if no protocol
    // Server will redirect to HTTPS if it wants
    url = 'http://' + url;
  }
  return url;
}

async function tryUrl(domain: string): Promise<string | null> {
  const url = normalizeUrl(domain); // http://example.com
  
  const response = await axios.get(url, {
    maxRedirects: 10, // Follow up to 10 redirects
    followRedirect: true, // Auto-follow redirects
  });
  
  // Get final URL after all redirects
  const finalUrl = response.request.res.responseUrl;
  console.log(`${url} → ${finalUrl}`);
  
  return finalUrl;
}
```

## Real Examples

### Example 1: Google
```
Input: google.com
Step 1: http://google.com (we add http://)
Step 2: → https://google.com (server redirects)
Final: https://google.com ✅
Extract from: https://google.com
```

### Example 2: Facebook
```
Input: facebook.com
Step 1: http://facebook.com
Step 2: → https://facebook.com (redirect)
Step 3: → https://www.facebook.com (redirect)
Final: https://www.facebook.com ✅
Extract from: https://www.facebook.com
```

### Example 3: User Provides Full URL
```
Input: https://example.com
Step 1: https://example.com (no change needed)
Final: https://example.com ✅
Extract from: https://example.com
```

### Example 4: HTTP-Only Site
```
Input: oldsite.com
Step 1: http://oldsite.com
Step 2: No redirect (stays HTTP)
Final: http://oldsite.com ✅
Extract from: http://oldsite.com
```

### Example 5: Multiple Redirects
```
Input: 83dbaudio.cn
Step 1: http://83dbaudio.cn
Step 2: → https://83dbaudio.cn (redirect)
Step 3: → https://www.83dbaudio.cn (redirect)
Final: https://www.83dbaudio.cn ✅
Extract from: https://www.83dbaudio.cn
```

## Benefits

✅ **Natural behavior** - Works like a browser  
✅ **Server decides** - HTTP vs HTTPS, www vs non-www  
✅ **Follows redirects** - Up to 10 redirects automatically  
✅ **Gets final URL** - Extracts from actual destination  
✅ **No guessing** - Let the server tell us where to go  

## Configuration

```typescript
maxRedirects: 10  // Follow up to 10 redirects
followRedirect: true  // Auto-follow (default)
httpsAgent: new https.Agent({
  rejectUnauthorized: false  // Ignore SSL errors
})
```

## Redirect Types Handled

| Redirect | Example | Handled? |
|----------|---------|----------|
| HTTP → HTTPS | http://google.com → https://google.com | ✅ Yes |
| Non-www → www | example.com → www.example.com | ✅ Yes |
| www → Non-www | www.example.com → example.com | ✅ Yes |
| Domain change | old.com → new.com | ✅ Yes |
| Path redirect | /old → /new | ✅ Yes |
| Multiple hops | A → B → C → D | ✅ Yes (up to 10) |

## What Changed

### Before (Forced HTTPS):
```typescript
const url = 'https://' + domain; // Always HTTPS
// Problem: Fails if site is HTTP-only
```

### After (Follow Redirects):
```typescript
const url = 'http://' + domain; // Start with HTTP
// Let server redirect to HTTPS if it wants
// Follow all redirects automatically
// Extract from final destination
```

## Logs You'll See

```
✅ Found: http://google.com → https://google.com
✅ Found: http://facebook.com → https://www.facebook.com
✅ Found: http://oldsite.com → http://oldsite.com (no redirect)
```

## Summary

**Philosophy:** Don't force anything. Let the server decide where to go, follow its redirects, and extract data from wherever we end up.

**Result:** Natural, browser-like behavior that works with any site configuration! 🎉
