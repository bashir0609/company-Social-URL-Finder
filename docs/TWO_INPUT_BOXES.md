# Two Input Boxes Feature ✅

## What Was Added

Created **two separate input boxes** for better user experience:

### 1. Company Name Input
- **Label:** "Company Name"
- **Placeholder:** "e.g., Microsoft, Nike, Google"
- **Purpose:** User enters the company name

### 2. Company Domain Input (Optional)
- **Label:** "Company Domain (Optional)"
- **Placeholder:** "e.g., microsoft.com, 83dbaudio.cn"
- **Purpose:** User can directly provide the domain for faster results

## How It Works

### Priority Logic
```typescript
const searchInput = companyDomain.trim() || companyInput.trim();
```

1. **If domain is provided** → Use domain directly (faster, more accurate)
2. **If only name is provided** → Search for the website
3. **If both are provided** → Domain takes priority

### Examples

| Company Name | Company Domain | What Gets Used |
|--------------|----------------|----------------|
| Nike | nike.com | ✅ nike.com |
| Microsoft | (empty) | Searches for microsoft.com |
| (empty) | 83dbaudio.cn | ✅ 83dbaudio.cn |
| Google | google.com | ✅ google.com |

## Benefits

✅ **Faster Results** - Direct domain = no website search needed  
✅ **More Accurate** - User provides exact domain (no guessing)  
✅ **Flexible** - Works with name only, domain only, or both  
✅ **Better UX** - Clear separation of inputs  

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Company Name              Company Domain (Optional) │
│  ┌──────────────────┐     ┌──────────────────┐     │
│  │ e.g., Nike       │     │ e.g., nike.com   │     │
│  └──────────────────┘     └──────────────────┘     │
│                                                      │
│  💡 Tip: Provide domain for faster results          │
│                                                      │
│  [ Find Social URLs ]                                │
└─────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

- **Enter** - Submit search (from either input)
- **Ctrl+Enter** - Submit search (works if either field has value)
- **Escape** - Clear both inputs and results
- **Ctrl+K** - Focus first input

## Use Cases

### 1. User Knows Domain
```
Company Name: (empty)
Company Domain: 83dbaudio.cn
→ Uses 83dbaudio.cn directly ✅
```

### 2. User Only Knows Name
```
Company Name: Nike
Company Domain: (empty)
→ Searches for nike.com
```

### 3. User Provides Both
```
Company Name: Nike
Company Domain: nike.com
→ Uses nike.com (domain takes priority) ✅
```

## Files Modified

1. **pages/index.tsx**
   - Added `companyDomain` state
   - Updated `handleSingleSearch()` to use domain if provided
   - Created two separate input boxes with labels
   - Updated keyboard shortcuts
   - Added helpful tip text

## Testing

Try these scenarios:
1. Enter only company name → Should search for website
2. Enter only domain → Should use domain directly
3. Enter both → Should use domain
4. Press Enter in either field → Should submit
5. Press Escape → Should clear both fields

## Result

✅ **Better UX** - Users can provide exact domain for faster results  
✅ **More Flexible** - Works with name, domain, or both  
✅ **Clearer Interface** - Separate inputs with labels  
✅ **Faster Processing** - Direct domain skips website search  
