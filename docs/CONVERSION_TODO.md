# Converting to Pure Web Scraping App - Remaining Tasks

## ✅ COMPLETED (Backend)
- ✅ Removed `geminiAISearch` function
- ✅ Removed `aiSearchSocialProfiles` function  
- ✅ Removed AI method logic from main handler
- ✅ Removed AI parameters: `method`, `apiKey`, `geminiApiKey`, `customPrompt`, `model`, `aiProvider`
- ✅ Simplified API to only accept: `company`, `platforms`, `fast_mode`, `fields_to_extract`

## ❌ REMAINING (Frontend - pages/index.tsx)

### 1. Remove State Variables (Lines 32-59)
Delete these lines:
```typescript
const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini'>('openrouter');
const [apiKey, setApiKey] = useState('');
const [geminiApiKey, setGeminiApiKey] = useState('');
const [showApiKey, setShowApiKey] = useState(false);
const [method, setMethod] = useState<'extraction' | 'ai' | 'hybrid'>('extraction');
const [customPrompt, setCustomPrompt] = useState('');
const [showAdvanced, setShowAdvanced] = useState(false);
const [showApiKeys, setShowApiKeys] = useState(false);
const [availableModels, setAvailableModels] = useState<Array<{id: string; name: string; isFree?: boolean}>>([]);
const [selectedModel, setSelectedModel] = useState<string>('');
const [loadingModels, setLoadingModels] = useState(false);
const [hasEnvKeys, setHasEnvKeys] = useState({ openrouter: false, gemini: false });
```

### 2. Remove useEffect Hooks (Lines 104-138)
Delete:
- `checkEnvVars` useEffect (lines 105-124)
- Auto-fetch models useEffect (lines 127-138)

### 3. Remove Functions (Lines 176-203)
Delete:
- `fetchModels` function (entire function)

### 4. Remove Sidebar (Lines 511-731)
Delete entire sidebar section from:
```typescript
{/* Sidebar */}
<div className={`fixed top-0 right-0...
```
to:
```typescript
{showSidebar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={() => setShowSidebar(false)}
  />
)}
```

### 5. Remove Settings Button (Lines 762-767)
Delete the settings button:
```typescript
<button
  onClick={() => setShowSidebar(true)}
  className={`p-3 rounded-lg...`}
  title="Settings"
>
  <Settings className="w-5 h-5" />
</button>
```

### 6. Remove Method Selection UI (Lines 782-1080)
Delete entire section from:
```typescript
<div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
  <div className="mb-6">
    <label className="block text-lg font-bold text-gray-800 mb-4">
      Choose Search Method
    </label>
```
All the way through AI provider selection, model selection, and custom prompt sections.

### 7. Simplify Progress Messages (Lines 219-239)
Replace with:
```typescript
setTimeout(() => setSearchProgress('🚀 Step 1: Trying direct profile URLs...'), 500);
setTimeout(() => setSearchProgress('🌐 Step 2: Finding company website...'), 2000);
setTimeout(() => setSearchProgress('📋 Step 3: Extracting data from website...'), 4000);
setTimeout(() => setSearchProgress('✅ Processing results...'), 6000);
```

## Quick Fix Approach

Instead of manual edits, you could:

1. **Keep only these state variables:**
   - activeTab, companyInput, loading, result, bulkResults, bulkFile, bulkProgress
   - copiedUrl, recentSearches, showRecentSearches, errorMessage, darkMode
   - searchProgress, selectedPlatforms, visitorCount, searchCount
   - availableColumns, selectedColumn, bulkProcessing, bulkProgressLog
   - currentPage, itemsPerPage, visibleColumns, showColumnSelector
   - fieldsToExtract, showFieldSelector

2. **Remove all UI sections that reference:**
   - method, aiProvider, apiKey, geminiApiKey, customPrompt
   - selectedModel, availableModels, loadingModels, hasEnvKeys
   - showApiKey, showAdvanced, showApiKeys, showSidebar

3. **Keep only:**
   - Dark mode toggle
   - Single/Bulk tabs
   - Field selector (for choosing what to extract)
   - Column visibility selector (for results display)
   - Platform filter (optional)

## Result
A clean, simple web scraping app with:
- ✅ Single company search
- ✅ Bulk CSV/Excel processing  
- ✅ Field selection (choose what data to extract)
- ✅ Column visibility (choose what to display)
- ✅ Dark mode
- ❌ No AI methods
- ❌ No API keys
- ❌ No method selection
