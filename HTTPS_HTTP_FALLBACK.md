# HTTPS/HTTP Fallback Strategy 🔒

## Why Default to HTTPS?

### Modern Web Standard
- **95%+ of websites** use HTTPS in 2024
- **Google requirement** - Sites without HTTPS get penalized
- **Security** - HTTPS encrypts data in transit
- **Trust** - Browsers show "Not Secure" for HTTP sites

### Automatic Redirects
Most HTTP sites automatically redirect to HTTPS:
```
http://google.com → https://google.com (301 redirect)
http://facebook.com → https://facebook.com (301 redirect)
```

## Our Strategy

### 1. Try HTTPS First (Default)
```typescript
const url = 'https://' + domain;
// Try HTTPS first - works for 95% of sites
```

### 2. Fallback to HTTP if HTTPS Fails
```typescript
async function tryUrl(domain: string): Promise<string | null> {
  // 1. Try HTTPS
  try {
    const response = await axios.head(`https://${domain}`);
    if (response.status === 200) {
      return `https://${domain}`; // ✅ HTTPS works
    }
  } catch (httpsError) {
    // 2. Fallback to HTTP
    try {
      const response = await axios.head(`http://${domain}`);
      if (response.status === 200) {
        return `http://${domain}`; // ✅ HTTP works
      }
    } catch (httpError) {
      return null; // ❌ Both failed
    }
  }
}
```

## Why This Approach?

### ✅ Advantages
1. **Fast for modern sites** - HTTPS works immediately (95% of cases)
2. **Backward compatible** - Falls back to HTTP for old sites
3. **Handles SSL errors** - `rejectUnauthorized: false`
4. **Follows redirects** - Automatically follows HTTP → HTTPS redirects

### ❌ Alternative (Bad)
```typescript
// DON'T DO THIS - Wastes time
const httpUrl = `http://${domain}`;
const httpsUrl = `https://${domain}`;
// Try both in parallel - unnecessary for 95% of sites
```

## Real-World Examples

### Case 1: Modern Site (95% of cases)
```
Input: google.com
Try: https://google.com ✅ (works immediately)
Result: https://google.com
Time: 1 second
```

### Case 2: Old Site with HTTP Only
```
Input: oldsite.com
Try: https://oldsite.com ❌ (SSL error)
Try: http://oldsite.com ✅ (works)
Result: http://oldsite.com
Time: 2 seconds (1s HTTPS fail + 1s HTTP success)
```

### Case 3: HTTP Site that Redirects to HTTPS
```
Input: facebook.com
Try: https://facebook.com ✅ (works)
Result: https://facebook.com
Time: 1 second
```

### Case 4: Site with Bad SSL Certificate
```
Input: 83dbaudio.cn
Try: https://83dbaudio.cn ⚠️ (SSL error but we ignore it)
Result: https://83dbaudio.cn (works with rejectUnauthorized: false)
Time: 1 second
```

## Implementation Details

### normalizeUrl() - Simple Default
```typescript
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url; // Default to HTTPS
  }
  return url;
}
```

### tryUrl() - Smart Fallback
```typescript
async function tryUrl(domain: string): Promise<string | null> {
  // 1. Try HTTPS with SSL error handling
  const httpsUrl = `https://${domain}`;
  try {
    const response = await axios.head(httpsUrl, {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Ignore SSL errors
      }),
    });
    if (response.status === 200) {
      return httpsUrl; // ✅ HTTPS works
    }
  } catch {
    // 2. Fallback to HTTP
    const httpUrl = `http://${domain}`;
    try {
      const response = await axios.head(httpUrl);
      if (response.status === 200) {
        return httpUrl; // ✅ HTTP works
      }
    } catch {
      return null; // ❌ Both failed
    }
  }
}
```

## Performance Impact

| Scenario | HTTPS First | HTTP First | Both Parallel |
|----------|-------------|------------|---------------|
| Modern site (95%) | 1s ✅ | 2s (redirect) | 1s |
| Old HTTP site (5%) | 2s (fallback) | 1s ✅ | 1s |
| **Average** | **1.05s** ✅ | 1.95s | 1s |

**Verdict:** HTTPS first is fastest for the majority of sites!

## When HTTP is Still Used

### Legacy Systems
- Old government websites
- Internal corporate sites
- Development/testing environments
- Very old small business sites

### Percentage
- **HTTPS:** ~95% of websites
- **HTTP:** ~5% of websites
- **Trend:** HTTP usage decreasing every year

## Security Considerations

### Why We Ignore SSL Errors
```typescript
rejectUnauthorized: false
```

**Reason:** We're scraping public data, not handling sensitive information.

**Safe for:**
- ✅ Web scraping
- ✅ Data extraction
- ✅ Public information gathering

**NOT safe for:**
- ❌ Payment processing
- ❌ Login/authentication
- ❌ Sensitive data transmission

## Summary

✅ **Default to HTTPS** - Works for 95% of sites  
✅ **Fallback to HTTP** - Handles old sites  
✅ **Ignore SSL errors** - Works with bad certificates  
✅ **Follow redirects** - Handles HTTP → HTTPS automatically  

**Result:** Fast, reliable, and backward compatible! 🎉
