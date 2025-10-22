# URL .com Duplication Bug - Investigation & Fix

## Problem

URLs are getting `.com` appended incorrectly, resulting in malformed URLs like:
```
https://sendgrid.com/en-us.com
https://www.bdapharma.com/.com
https://www.rebecca.io/.com
https://propercloth.com/?srsltid=...gnx.com
```

## Root Cause Analysis

### Pattern Observed
```
Input: sendgrid.com/en-us
Result: https://sendgrid.com/en-us.com

Input: bdapharma.com/
Result: https://www.bdapharma.com/.com

Input: rebecca.io/
Result: https://www.rebecca.io/.com
```

The `.com` is being appended to paths and trailing slashes!

### Where This Happens

Looking at the code flow:

1. **User inputs:** `sendgrid.com/en-us`
2. **URL detection regex:** `/\.[a-z]{2,4}$/i` 
   - This matches `.us` at the end of `/en-us`
   - Incorrectly treats it as a TLD
3. **tryUrl() is called** with the full path
4. **Somewhere `.com` is being appended**

### The Bug

The issue is likely in **bulk processing** or **frontend input handling** where:
- Company names from CSV might have URLs with paths
- The system treats paths as domains
- Appends `.com` to complete what it thinks is an incomplete domain

## Potential Sources

### 1. CSV Data Issue
If the CSV has:
```csv
Company
sendgrid.com/en-us
bdapharma.com/
rebecca.io/
```

The system might be:
1. Detecting these as URLs (correct)
2. But then trying to "fix" them by appending `.com` (incorrect)

### 2. URL Validation Logic
The regex at line 1370:
```typescript
const isUrl = company.includes('.') && /\.[a-z]{2,4}$/i.test(company) && !company.includes(' ');
```

This will match:
- ✅ `sendgrid.com` → ends with `.com`
- ❌ `sendgrid.com/en-us` → ends with `.us` (false positive!)
- ❌ `bdapharma.com/` → ends with `/` (but still has `.com` before it)

### 3. findCompanyWebsite() Logic
At line 1218:
```typescript
patterns.push(`${variation}.${tld}`);
```

If `variation` already contains a path, this creates:
```
sendgrid.com/en-us + .com = sendgrid.com/en-us.com
```

## The Fix

### Fix 1: Improve URL Detection
```typescript
// OLD (line 1370)
const isUrl = company.includes('.') && /\.[a-z]{2,4}$/i.test(company) && !company.includes(' ');

// NEW - Check for protocol or www, or valid domain format
const isUrl = company.includes('.') && (
  company.startsWith('http://') || 
  company.startsWith('https://') || 
  company.startsWith('www.') ||
  /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(company) // domain with optional path
) && !company.includes(' ');
```

### Fix 2: Clean Input Before Processing
```typescript
// Before passing to tryUrl or findCompanyWebsite
function cleanCompanyInput(input: string): string {
  let cleaned = input.trim();
  
  // If it's a URL with path, extract just the domain
  if (cleaned.includes('/')) {
    try {
      // Add protocol if missing
      if (!cleaned.startsWith('http')) {
        cleaned = 'https://' + cleaned;
      }
      const url = new URL(cleaned);
      // Return just the domain
      return url.hostname;
    } catch {
      // If URL parsing fails, remove everything after first /
      const parts = cleaned.split('/');
      return parts[0];
    }
  }
  
  // Remove trailing dots or slashes
  cleaned = cleaned.replace(/[/.]+$/, '');
  
  return cleaned;
}
```

### Fix 3: Validate Before Appending TLD
```typescript
// In findCompanyWebsite(), before creating patterns
async function findCompanyWebsite(companyName: string): Promise<string> {
  const cleanName = companyName.trim().toLowerCase();
  
  // If it already looks like a domain with TLD, don't modify it
  if (/\.[a-z]{2,}$/i.test(cleanName) && !cleanName.includes('/')) {
    // It's already a complete domain, just try it
    return await tryUrl(cleanName) || '';
  }
  
  // Otherwise, generate variations...
  const nameVariations = [
    cleanName.replace(/\s+/g, ''),
    cleanName.replace(/\s+/g, '-'),
    // ...
  ];
  
  // Rest of the logic...
}
```

## Immediate Fix Applied

Fixed the contact page URL construction in `enhancedExtraction()`:
```typescript
// OLD
contactPageUrl = new URL(href, website).toString();

// NEW
if (href.startsWith('http://') || href.startsWith('https://')) {
  contactPageUrl = href;
} else {
  contactPageUrl = new URL(href, finalUrl).toString();
}
```

This prevents malformed URLs when constructing contact page links.

## Testing

### Test Cases
```
Input: "sendgrid.com/en-us"
Expected: https://sendgrid.com (domain only)
Current: https://sendgrid.com/en-us.com ❌

Input: "bdapharma.com/"
Expected: https://bdapharma.com
Current: https://www.bdapharma.com/.com ❌

Input: "rebecca.io/"
Expected: https://rebecca.io
Current: https://www.rebecca.io/.com ❌

Input: "microsoft.com"
Expected: https://microsoft.com
Current: ✅ (works correctly)
```

## Recommended Actions

1. ✅ **Fixed:** Contact page URL construction
2. 🔄 **TODO:** Add input cleaning function
3. 🔄 **TODO:** Improve URL detection regex
4. 🔄 **TODO:** Validate before appending TLD in findCompanyWebsite()
5. 🔄 **TODO:** Add logging to trace where `.com` is being added

## Debugging Steps

To find exactly where `.com` is being appended:

1. Add logging in `findCompanyWebsite()`:
```typescript
console.log(`[DEBUG] findCompanyWebsite input: "${companyName}"`);
console.log(`[DEBUG] Trying pattern: "${pattern}"`);
```

2. Add logging in `tryUrl()`:
```typescript
console.log(`[DEBUG] tryUrl input: "${domain}"`);
console.log(`[DEBUG] Normalized URL: "${url}"`);
```

3. Add logging in main handler:
```typescript
console.log(`[DEBUG] Original company input: "${company}"`);
console.log(`[DEBUG] isUrl: ${isUrl}`);
console.log(`[DEBUG] Calling tryUrl/findCompanyWebsite with: "${company}"`);
```

## Status

- ✅ Contact page URL construction fixed
- 🔄 Root cause of `.com` duplication still needs investigation
- 🔄 Need to add input cleaning before URL processing
- 🔄 Need to improve URL detection logic

## Next Steps

1. Restart dev server to apply contact page fix
2. Test with problematic URLs
3. Add debug logging to trace `.com` appending
4. Implement input cleaning function
5. Update URL detection regex
