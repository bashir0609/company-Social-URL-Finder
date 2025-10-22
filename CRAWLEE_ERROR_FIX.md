# Crawlee Error Fix - maxUsedMemoryRatio

## Error Message

```
ArgumentError: Did not expect property `maxUsedMemoryRatio` to exist, got `0.85` in object `options`
```

## What Happened

I initially added a `maxUsedMemoryRatio` property to optimize memory, but this property **doesn't exist in the current version of Crawlee**. The TypeScript linter caught this and I removed it, but your dev server is still running the **old cached code**.

## The Fix

### ✅ Code Already Fixed

The problematic code has been removed from `crawlee-scraper.ts`:

**Removed:**
```typescript
systemStatusOptions: {
  maxUsedMemoryRatio: 0.85,  // ❌ This property doesn't exist
}
```

**Current (correct) code:**
```typescript
autoscaledPoolOptions: {
  maxConcurrency: 1,
  desiredConcurrency: 1,
  // No systemStatusOptions - removed!
},
```

### 🔄 You Need to Restart Dev Server

**The issue is your dev server is using cached code.**

## How to Fix

### Option 1: Restart Dev Server (Recommended)

**Step 1: Stop the server**
```
Press Ctrl+C in the terminal
```

**Step 2: Clear Next.js cache**
```bash
# Delete the .next folder
rmdir /s /q .next

# Or manually delete:
# C:\Users\ISLAH3\Desktop\Apps\Japascript\company-Social-URL-Finder\.next
```

**Step 3: Restart**
```bash
npm run dev
```

### Option 2: Use the Batch File

**Simply close and restart:**
```
1. Close the current terminal/window
2. Run "Start Social Finder.bat" again
```

### Option 3: Hard Restart

**If the error persists:**

```bash
# Stop server (Ctrl+C)

# Clear all caches
rmdir /s /q .next
rmdir /s /q node_modules\.cache

# Reinstall dependencies (if needed)
npm install

# Restart
npm run dev
```

## Why This Happens

### Next.js Caching

Next.js caches compiled code for faster development:

```
.next/
├── cache/           ← Compiled TypeScript
├── server/          ← Server-side code
└── static/          ← Static assets
```

When you edit a file, Next.js **should** recompile automatically, but sometimes:
- ❌ Cache doesn't invalidate
- ❌ Old code keeps running
- ❌ Errors persist even after fixing

**Solution:** Delete `.next` folder and restart.

## Verification

After restarting, you should see:

**✅ Success logs:**
```
INFO  PlaywrightCrawler: Starting the crawler.
INFO  Scraping https://example.com
INFO  Found X social links
INFO  Finished! Total 1 requests: 1 succeeded, 0 failed.
```

**❌ No more error:**
```
ArgumentError: Did not expect property `maxUsedMemoryRatio` to exist
```

## Current Memory Optimization

The code now uses **valid** memory optimization settings:

```typescript
// ✅ These work correctly
maxConcurrency: 1,
autoscaledPoolOptions: {
  maxConcurrency: 1,
  desiredConcurrency: 1,
},

// ✅ Browser flags for memory reduction
args: [
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--window-size=1024,768',
  // ... more flags
]
```

**Memory will still be optimized, just without the invalid property!**

## Summary

| Issue | Status |
|-------|--------|
| **Code error** | ✅ Fixed (removed invalid property) |
| **Cache issue** | 🔄 Need to restart dev server |
| **Memory optimization** | ✅ Still working (using valid settings) |

## Quick Fix Commands

```bash
# Windows PowerShell
# Stop server (Ctrl+C), then:

# Delete cache
Remove-Item -Recurse -Force .next

# Restart
npm run dev
```

```bash
# Or use Command Prompt
# Stop server (Ctrl+C), then:

# Delete cache
rmdir /s /q .next

# Restart
npm run dev
```

## If Error Still Persists

**1. Check if file is saved**
- Open `pages/api/crawlee-scraper.ts`
- Verify no `maxUsedMemoryRatio` in the file
- Save the file (Ctrl+S)

**2. Check for multiple instances**
- Make sure only ONE dev server is running
- Close all terminals
- Start fresh with batch file

**3. Nuclear option**
```bash
# Stop everything
# Delete both cache folders
rmdir /s /q .next
rmdir /s /q node_modules\.cache

# Restart
npm run dev
```

---

**TL;DR: The code is fixed, you just need to restart your dev server to clear the cache!**

## Restart Instructions

**Easiest way:**
1. Press `Ctrl+C` to stop the server
2. Close the terminal window
3. Double-click `Start Social Finder.bat`
4. Wait for server to start
5. Test again

**The error should be gone!** ✅
