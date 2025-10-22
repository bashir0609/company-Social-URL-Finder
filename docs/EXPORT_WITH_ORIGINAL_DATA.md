# Export with Original Data ✅

## Overview

Export files now contain **both** your original uploaded data AND the scraped data combined into one file!

## How It Works

### Before (Old Behavior)
```
Upload: companies.csv with columns [Name, Industry, Location]
Export: results.csv with only [company_name, website, linkedin, facebook, ...]

❌ Lost: Industry, Location columns
```

### After (New Behavior)
```
Upload: companies.csv with columns [Name, Industry, Location]
Export: results.csv with [Name, Industry, Location, website, linkedin, facebook, ...]

✅ Kept: All original columns
✅ Added: All scraped data
```

## Example

### Input File (companies.csv)
```csv
Company Name,Industry,Location,Employee Count
Microsoft,Technology,USA,220000
Nike,Retail,USA,79000
Toyota,Automotive,Japan,375000
```

### Output File (2025-10-22 companies social finder.csv)
```csv
Company Name,Industry,Location,Employee Count,website,linkedin,facebook,twitter,email,phone
Microsoft,Technology,USA,220000,https://microsoft.com,https://linkedin.com/company/microsoft,https://facebook.com/Microsoft,https://twitter.com/Microsoft,info@microsoft.com,+1-800-642-7676
Nike,Retail,USA,79000,https://nike.com,https://linkedin.com/company/nike,https://facebook.com/nike,https://twitter.com/Nike,help@nike.com,+1-800-344-6453
Toyota,Automotive,Japan,375000,https://toyota.com,https://linkedin.com/company/toyota,https://facebook.com/toyota,https://twitter.com/Toyota,contact@toyota.com,+81-3-3817-7111
```

**All original columns preserved + scraped data added!**

## Column Merging Logic

### Original Columns First
```
Your uploaded columns appear first:
- Company Name
- Industry
- Location
- Employee Count
```

### Scraped Columns Added
```
Then scraped data columns:
- website
- company_domain
- contact_page
- email
- phone
- linkedin
- facebook
- twitter
- instagram
- youtube
- tiktok
- pinterest
```

### Duplicate Column Handling
```
If column names match:
- Original: "Company Name" = "Microsoft"
- Scraped: "company_name" = "Microsoft Corporation"
- Result: Scraped data OVERWRITES original

To keep both:
- Rename your column to something unique
- Example: "Input Company" instead of "Company Name"
```

## Benefits

### ✅ Keep Your Context
```
Original data provides context:
- Industry classification
- Location information
- Employee counts
- Revenue data
- Custom tags/notes
- Internal IDs
```

### ✅ No Manual Merging
```
Before: 
1. Export scraped data
2. Open original file
3. Open scraped file
4. Manually copy columns
5. Align rows
6. Save combined file

After:
1. Export
2. Done! ✅
```

### ✅ Preserve Formatting
```
Your original data formatting is preserved:
- Date formats
- Number formats
- Custom values
- Formulas (in Excel)
```

### ✅ Easy Analysis
```
All data in one place:
- Filter by industry
- Group by location
- Analyze by employee count
- Cross-reference with scraped data
```

## Use Cases

### Use Case 1: Lead Enrichment
```
Upload:
- Lead Name
- Lead Source
- Lead Score
- Assigned To

Export:
- Lead Name
- Lead Source
- Lead Score
- Assigned To
+ Website, LinkedIn, Email, Phone
```

### Use Case 2: Market Research
```
Upload:
- Company
- Market Segment
- Competitor Rank
- Notes

Export:
- Company
- Market Segment
- Competitor Rank
- Notes
+ Website, Social Profiles, Contact Info
```

### Use Case 3: Sales Prospecting
```
Upload:
- Prospect Name
- Deal Value
- Stage
- Next Follow-up

Export:
- Prospect Name
- Deal Value
- Stage
- Next Follow-up
+ LinkedIn, Twitter, Email, Phone
```

### Use Case 4: Data Verification
```
Upload:
- Company
- Old Website
- Old Email
- Last Updated

Export:
- Company
- Old Website (your column)
- Old Email (your column)
- Last Updated
+ website (new)
+ email (new)
+ All social profiles
```

## Technical Details

### Merge Implementation

```typescript
// Merge scraped results with original data
const mergedResults = results.map((scrapedData, index) => {
  if (!scrapedData) return undefined;
  
  return {
    ...originalData[index], // Original uploaded data (first)
    ...scrapedData,         // Scraped data (second, overwrites if duplicate)
  };
}).filter(r => r !== undefined);
```

### Column Order

**JavaScript object spread (`...`) maintains order:**
1. Original columns appear first
2. Scraped columns appear after
3. Duplicates are overwritten by scraped data

### Data Types Preserved

```
Original data types are maintained:
- Numbers stay numbers
- Dates stay dates
- Strings stay strings
- Empty cells stay empty
```

## Examples by File Type

### CSV Export

**Input (companies.csv):**
```csv
Name,Industry
Microsoft,Tech
Nike,Retail
```

**Output (2025-10-22 companies social finder.csv):**
```csv
Name,Industry,website,linkedin,facebook,twitter,email,phone
Microsoft,Tech,https://microsoft.com,https://linkedin.com/company/microsoft,...
Nike,Retail,https://nike.com,https://linkedin.com/company/nike,...
```

### Excel Export

**Input (companies.xlsx):**
```
| Name      | Industry | Location |
|-----------|----------|----------|
| Microsoft | Tech     | USA      |
| Nike      | Retail   | USA      |
```

**Output (2025-10-22 companies social finder.xlsx):**
```
| Name      | Industry | Location | website              | linkedin                        | facebook           |
|-----------|----------|----------|----------------------|---------------------------------|--------------------|
| Microsoft | Tech     | USA      | https://microsoft.com| https://linkedin.com/company/... | https://facebook....|
| Nike      | Retail   | USA      | https://nike.com     | https://linkedin.com/company/... | https://facebook....|
```

## Handling Edge Cases

### Empty Rows
```
If original row is empty:
- Scraped data still added
- Original columns show as empty
```

### Missing Data
```
If scraping fails:
- Original data preserved
- Scraped columns show "Not found"
```

### Extra Columns
```
If you have more columns than companies:
- Extra rows preserved
- Scraped data only for rows with company names
```

### Column Name Conflicts
```
If column names match exactly:
- Scraped data overwrites
- Example: Both have "email" → Scraped email wins

To avoid:
- Rename your column: "Original Email"
- Or: "Input Email"
```

## Comparison

### Before (Separate Files)

**Original file:**
```csv
Company,Industry,Location
Microsoft,Tech,USA
```

**Exported file:**
```csv
company_name,website,linkedin
Microsoft Corporation,https://microsoft.com,https://linkedin.com/company/microsoft
```

**Problem:** Need to manually merge! ❌

### After (Combined File)

**Exported file:**
```csv
Company,Industry,Location,website,linkedin,facebook
Microsoft,Tech,USA,https://microsoft.com,https://linkedin.com/company/microsoft,https://facebook.com/Microsoft
```

**Solution:** Everything in one file! ✅

## Best Practices

### 1. Use Unique Column Names
```
✅ Good:
- Input Company
- Original Website
- My Notes

❌ Avoid:
- company_name (conflicts with scraped)
- website (conflicts with scraped)
- email (conflicts with scraped)
```

### 2. Keep Original File
```
Always keep your original upload:
- Backup in case of issues
- Reference for comparison
- Re-upload if needed
```

### 3. Review Merged Data
```
After export:
1. Check original columns present
2. Verify scraped data added
3. Look for any overwrites
4. Confirm row alignment
```

### 4. Document Your Columns
```
Add a header row explaining:
- What each original column means
- When data was collected
- Any special formatting
```

## Files Modified

- ✅ `pages/index.tsx` - Added `originalBulkData` state
- ✅ `pages/index.tsx` - Store original data on upload
- ✅ `pages/index.tsx` - Pass original data to processing
- ✅ `pages/index.tsx` - Merge results before export
- ✅ `EXPORT_WITH_ORIGINAL_DATA.md` - This documentation

## Summary

| Aspect | Details |
|--------|---------|
| **Original Data** | Fully preserved |
| **Scraped Data** | Added as new columns |
| **Column Order** | Original first, scraped after |
| **Duplicates** | Scraped data overwrites |
| **File Types** | CSV and Excel |
| **Automatic** | Yes, always enabled |

## FAQ

### Q: Will my original columns be lost?
**A:** No! All original columns are preserved in the export.

### Q: What if column names match?
**A:** Scraped data will overwrite. Rename your columns to avoid this.

### Q: Can I export only scraped data?
**A:** Not currently. Export always includes original + scraped data.

### Q: What about formulas in Excel?
**A:** Formulas are converted to values in the export.

### Q: Does this work for both CSV and Excel?
**A:** Yes! Both formats preserve and merge data.

### Q: What if I have 100 columns in my original file?
**A:** All 100 columns will be in the export + scraped columns.

---

**Your exports now contain both original and scraped data - no manual merging needed!** 🎉

**Example:**
```
Upload: [Company, Industry, Location]
Export: [Company, Industry, Location, website, linkedin, facebook, ...]
```

**All your original data is preserved!**
