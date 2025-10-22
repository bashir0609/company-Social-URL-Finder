# Export File Naming Structure ✅

## New Naming Format

Export files now follow this structure:
```
[DATE] [ORIGINAL_FILENAME] social finder.[EXTENSION]
```

## Examples

### CSV Export
**Upload file:** `companies.csv`  
**Export name:** `2025-10-22 companies social finder.csv`

**Upload file:** `client-list.xlsx`  
**Export name:** `2025-10-22 client-list social finder.csv`

### Excel Export
**Upload file:** `leads.csv`  
**Export name:** `2025-10-22 leads social finder.xlsx`

**Upload file:** `prospects-2024.xlsx`  
**Export name:** `2025-10-22 prospects-2024 social finder.xlsx`

## Format Breakdown

### 1. Date (YYYY-MM-DD)
```
2025-10-22
```
- **Format:** ISO 8601 date format
- **Benefits:** 
  - Sortable by name
  - Universal format
  - Easy to identify when exported

### 2. Original Filename
```
companies
client-list
leads
prospects-2024
```
- **Source:** Your uploaded file name (without extension)
- **Benefits:**
  - Know which file it came from
  - Easy to match with original data
  - Maintains your naming convention

### 3. Identifier
```
social finder
```
- **Fixed text:** Always "social finder"
- **Benefits:**
  - Instantly recognizable
  - Groups all exports together
  - Distinguishes from other files

### 4. Extension
```
.csv or .xlsx
```
- **CSV:** Download CSV button
- **XLSX:** Download Excel button

## Real-World Examples

### Example 1: Daily Export
```
Upload: company-list.csv
Export: 2025-10-22 company-list social finder.csv

Next day:
Upload: company-list.csv (same file)
Export: 2025-10-23 company-list social finder.csv
```
**Benefit:** Can track exports by date

### Example 2: Multiple Clients
```
Client A:
Upload: client-a-leads.xlsx
Export: 2025-10-22 client-a-leads social finder.xlsx

Client B:
Upload: client-b-prospects.csv
Export: 2025-10-22 client-b-prospects social finder.xlsx
```
**Benefit:** Easy to identify which client's data

### Example 3: Different Formats
```
Upload: companies.csv
CSV Export: 2025-10-22 companies social finder.csv
Excel Export: 2025-10-22 companies social finder.xlsx
```
**Benefit:** Both formats from same source, clearly labeled

## File Organization

### Recommended Folder Structure
```
Downloads/
├── 2025-10-22 companies social finder.csv
├── 2025-10-22 companies social finder.xlsx
├── 2025-10-22 leads social finder.csv
├── 2025-10-23 companies social finder.csv
└── 2025-10-23 prospects social finder.xlsx
```

**Sorts chronologically by default!**

### Search Examples
**Find all exports:**
```
Search: "social finder"
```

**Find specific date:**
```
Search: "2025-10-22"
```

**Find specific source:**
```
Search: "companies social finder"
```

## Technical Details

### Code Implementation

**CSV Export:**
```typescript
const date = new Date().toISOString().split('T')[0];
const originalName = bulkFile ? bulkFile.name.replace(/\.[^/.]+$/, '') : 'export';
link.download = `${date} ${originalName} social finder.csv`;
```

**Excel Export:**
```typescript
const date = new Date().toISOString().split('T')[0];
const originalName = bulkFile ? bulkFile.name.replace(/\.[^/.]+$/, '') : 'export';
const filename = `${date} ${originalName} social finder.xlsx`;
XLSX.writeFile(workbook, filename);
```

### Fallback Behavior
If no file is uploaded (shouldn't happen, but just in case):
```
Filename: 2025-10-22 export social finder.csv
```

### Extension Removal
```typescript
bulkFile.name.replace(/\.[^/.]+$/, '')
```

**Examples:**
- `companies.csv` → `companies`
- `leads.xlsx` → `leads`
- `data.CSV` → `data`
- `file.name.csv` → `file.name`

## Benefits

### ✅ Chronological Sorting
Files automatically sort by date in file explorer:
```
2025-10-20 companies social finder.csv
2025-10-21 companies social finder.csv
2025-10-22 companies social finder.csv
```

### ✅ Source Tracking
Know exactly which file the export came from:
```
Original: client-leads-q4.csv
Export: 2025-10-22 client-leads-q4 social finder.csv
```

### ✅ Easy Identification
All exports have "social finder" in the name:
```
Search Downloads for: "social finder"
→ Finds all your exports instantly
```

### ✅ No Overwrites
Different dates = different files:
```
2025-10-22 companies social finder.csv
2025-10-23 companies social finder.csv
```
**Never accidentally overwrite yesterday's export!**

### ✅ Professional Naming
Clear, descriptive, organized:
```
❌ Bad: company-social-urls.xlsx
❌ Bad: export.csv
❌ Bad: results.xlsx
✅ Good: 2025-10-22 companies social finder.xlsx
```

## Comparison

### Before
```
CSV: social-urls-2025-10-22.csv
Excel: company-social-urls.xlsx
```

**Problems:**
- ❌ Different formats for CSV vs Excel
- ❌ No source file tracking
- ❌ Excel has no date
- ❌ Hard to search
- ❌ Not sortable

### After
```
CSV: 2025-10-22 companies social finder.csv
Excel: 2025-10-22 companies social finder.xlsx
```

**Benefits:**
- ✅ Consistent format
- ✅ Includes source filename
- ✅ Both have dates
- ✅ Easy to search ("social finder")
- ✅ Sorts chronologically

## Use Cases

### Use Case 1: Daily Exports
```
Monday: 2025-10-21 daily-leads social finder.csv
Tuesday: 2025-10-22 daily-leads social finder.csv
Wednesday: 2025-10-23 daily-leads social finder.csv
```
**Track your daily progress!**

### Use Case 2: Multiple Projects
```
Project A: 2025-10-22 project-a-companies social finder.xlsx
Project B: 2025-10-22 project-b-prospects social finder.xlsx
Project C: 2025-10-22 project-c-leads social finder.xlsx
```
**Keep projects organized!**

### Use Case 3: Client Deliverables
```
Upload: acme-corp-leads.csv
Export: 2025-10-22 acme-corp-leads social finder.xlsx
```
**Professional filename for client delivery!**

### Use Case 4: Version Control
```
v1: 2025-10-20 companies social finder.csv
v2: 2025-10-21 companies social finder.csv (after corrections)
v3: 2025-10-22 companies social finder.csv (final)
```
**Track different versions by date!**

## FAQ

### Q: Can I change the naming format?
**A:** Yes, edit the code in `pages/index.tsx` lines 165-168 (CSV) and 510-512 (Excel).

### Q: What if I upload a file with no extension?
**A:** The code handles it - uses the full filename.

### Q: What if I upload "file.name.csv"?
**A:** Becomes "2025-10-22 file.name social finder.csv" (only removes last extension).

### Q: Can I remove "social finder" from the name?
**A:** Yes, edit the code and remove `social finder` from the template string.

### Q: What timezone is the date?
**A:** Your local system timezone (converted to ISO format).

### Q: Can I use a different date format?
**A:** Yes, modify the date formatting code. Current: `YYYY-MM-DD` (ISO 8601).

## Files Modified

- ✅ `pages/index.tsx` - Updated `exportToCSV()` function
- ✅ `pages/index.tsx` - Updated `downloadResults()` function
- ✅ `EXPORT_NAMING.md` - This documentation

## Summary

| Component | Value | Example |
|-----------|-------|---------|
| **Date** | YYYY-MM-DD | `2025-10-22` |
| **Original Name** | Upload filename (no ext) | `companies` |
| **Identifier** | Fixed text | `social finder` |
| **Extension** | .csv or .xlsx | `.csv` |
| **Full Example** | Complete filename | `2025-10-22 companies social finder.csv` |

---

**Your exports now have professional, organized, searchable filenames!** 🎉
