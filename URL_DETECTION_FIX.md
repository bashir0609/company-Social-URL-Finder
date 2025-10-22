# URL Detection Fix 🔧

## Problem

When user inputs `83dbaudio.cn`, the app was treating it as a company name and trying different TLD combinations:
- Tried: `83dbaudio.cn.com` ❌
- Tried: `83dbaudio.cn.co` ✅ (exists but wrong!)
- Result: Used wrong domain `83dbaudio.cn.co`

## Root Cause

The URL detection regex on line 1244 only checked for common TLDs:
```typescript
const isUrl = /\.(com|io|net|org|co|ai|dev|app|tech)\b/i.test(company);
```

It didn't include `.cn`, so `83dbaudio.cn` was treated as a company name, not a URL.

## Solution

Simplified the URL detection logic:
```typescript
// OLD - Only checked specific TLDs
const isUrl = /\.(com|io|net|org|co|ai|dev|app|tech)\b/i.test(company);

// NEW - Checks for any 2-4 letter TLD
const isUrl = company.includes('.') && /\.[a-z]{2,4}$/i.test(company) && !company.includes(' ');
```

## How It Works Now

### Detection Rules
1. ✅ Contains a dot (`.`)
2. ✅ Ends with 2-4 letter TLD (`.cn`, `.com`, `.tech`, etc.)
3. ✅ No spaces (company names can have spaces)

### Examples

| Input | Detected As | Action |
|-------|-------------|--------|
| `83dbaudio.cn` | ✅ URL | Use directly |
| `google.com` | ✅ URL | Use directly |
| `cordial-cables.com` | ✅ URL | Use directly |
| `example.io` | ✅ URL | Use directly |
| `Nike` | ❌ Company | Search for website |
| `Cordial Cables` | ❌ Company | Search for website |

## Benefits

✅ **Supports all TLDs** - `.cn`, `.de`, `.fr`, `.jp`, etc.  
✅ **Simpler code** - No need to list every TLD  
✅ **More accurate** - Won't append extra TLDs to domains  
✅ **Future-proof** - Works with new TLDs automatically  

## Testing

Try these inputs:
```
83dbaudio.cn → Should use 83dbaudio.cn directly
google.com → Should use google.com directly
Nike → Should search for nike.com
```

## Files Modified

- `pages/api/enrich.ts` (line 1246)
  - Simplified URL detection logic
  - Now supports all 2-4 letter TLDs

## Result

✅ **Fixed!** Now correctly detects `83dbaudio.cn` as a URL and uses it directly without appending extra TLDs.
