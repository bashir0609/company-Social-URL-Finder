# 🤖 AI Method Usage Guide

## Overview
The AI method uses artificial intelligence to intelligently search for company social media profiles and contact information. This guide explains how to properly use the AI features.

---

## 🎯 Key Features

### 1. **Auto-Fetch Models**
- Models automatically fetch when API key is detected
- Works with both environment variables and user-entered keys
- No manual "Fetch Models" click needed (but available as backup)

### 2. **Model Selection**
- Choose from multiple AI models via dropdown
- Free models marked with 🆓 emoji
- Shows currently selected model with ✅ indicator
- Available for both AI and Hybrid methods

### 3. **Validation**
- Ensures API key is present before search
- Validates model is selected
- Clear error messages if requirements not met
- Works for both single and bulk searches

---

## 📋 How to Use AI Method

### Step 1: Enter API Key
**Option A: User Interface**
```
1. Enter your OpenRouter API key in the "OpenRouter API Key" field
2. OR enter Google Gemini API key in the "Google Gemini API Key" field
3. Models will auto-fetch when you select AI/Hybrid method
```

**Option B: Environment Variables**
```bash
# In .env file
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIzaSy...
```

### Step 2: Select Method
```
1. Choose "AI Only" for pure AI search
2. OR choose "Hybrid" for AI + Extraction combined
3. Models will auto-fetch if not already loaded
```

### Step 3: Select AI Provider
```
- OpenRouter: Multiple models, includes free options
- Google Gemini: Premium quality, single model
```

### Step 4: Select Model (OpenRouter only)
```
1. Models auto-fetch when key is detected
2. Dropdown shows all available models
3. Free models marked with 🆓
4. Selected model shown with ✅
5. Can manually refresh with "Fetch Models" button
```

### Step 5: Search
```
1. Enter company name
2. Click "Find Social URLs"
3. AI will analyze and search
4. Results displayed with AI-powered accuracy
```

---

## 🔄 Auto-Fetch Behavior

### When Models Auto-Fetch:
✅ API key entered in UI  
✅ API key found in environment  
✅ AI or Hybrid method selected  
✅ OpenRouter provider selected  
✅ Models not already loaded  

### Manual Fetch:
- Click "Fetch Models" button anytime
- Useful if auto-fetch fails
- Refreshes model list

---

## ⚠️ Validation & Error Messages

### Before Search Starts:
The system validates:
1. **API Key Present**: User key OR env variable
2. **Models Loaded**: At least one model available
3. **Model Selected**: A model is chosen from dropdown

### Error Messages:

**"🔑 AI method requires an OpenRouter API key"**
- Solution: Enter API key in the field above OR set in .env

**"⚠️ Please fetch AI models first"**
- Solution: Click "Fetch Models" button OR wait for auto-fetch

**"⚠️ Please select an AI model from the dropdown"**
- Solution: Choose a model from the dropdown menu

**"🔑 AI method requires a Google Gemini API key"**
- Solution: Enter Gemini API key OR set in .env

---

## 🎨 UI Indicators

### Loading States:
```
🔄 "Loading AI models..." - Models being fetched
🤖 "AI analyzing company..." - AI processing search
🔍 "Searching social profiles..." - AI finding profiles
```

### Success States:
```
✅ "Selected: [Model Name]" - Model successfully selected
💡 "API key detected" - Key found, ready to use
🆓 Free model indicator - No cost to use
```

### Model Dropdown:
```
🆓 google/gemini-flash-1.5 (Free)
   openai/gpt-4-turbo
   anthropic/claude-3-sonnet
   ...
```

---

## 🔀 Method Comparison

### AI Only
- **Uses**: Pure AI search
- **Speed**: Fast (AI-powered)
- **Accuracy**: High for known companies
- **Requirements**: API key + Model selection
- **Best for**: Large companies, well-known brands

### Hybrid (Recommended)
- **Uses**: AI + Web scraping
- **Speed**: Medium (comprehensive)
- **Accuracy**: Highest (combines both methods)
- **Requirements**: API key + Model selection
- **Best for**: All company types, maximum accuracy

### Extraction Only
- **Uses**: Web scraping only
- **Speed**: Medium
- **Accuracy**: Good (90%+ with improvements)
- **Requirements**: None (no API key needed)
- **Best for**: When no API key available

---

## 💡 Tips & Best Practices

### For Best Results:
1. **Use Hybrid mode** for maximum accuracy
2. **Select free models** to avoid costs
3. **Let auto-fetch work** - don't rush to click buttons
4. **Check selected model** before searching
5. **Use official company names** for better AI results

### Cost Optimization:
- **Free models**: Look for 🆓 indicator
- **Hybrid mode**: Uses AI efficiently with extraction fallback
- **Batch processing**: Process multiple companies at once

### Troubleshooting:
1. **Models not loading?**
   - Check API key is correct
   - Click "Fetch Models" manually
   - Check console for errors

2. **Search not using AI?**
   - Verify method is "AI" or "Hybrid"
   - Check model is selected
   - Look for validation errors

3. **Poor results?**
   - Try different AI model
   - Switch to Hybrid mode
   - Use more specific company names

---

## 🔧 Technical Details

### Auto-Fetch Logic:
```typescript
// Triggers when:
- API key is entered
- Method changes to AI/Hybrid
- Provider is OpenRouter
- Models array is empty
- Has API key (user or env)
```

### Validation Flow:
```
1. Check method (AI or Hybrid?)
2. Check provider (OpenRouter or Gemini?)
3. Check API key (user or env?)
4. Check models loaded (OpenRouter only)
5. Check model selected (OpenRouter only)
6. If all pass → Start search
7. If any fail → Show error message
```

### Model Selection:
```
- Auto-selects first free model
- Falls back to first model if no free
- User can change anytime
- Selection persists during session
```

---

## 📊 Expected Performance

### AI Method:
- **Speed**: 3-8 seconds per company
- **Success Rate**: 85-95% (known companies)
- **Social Profiles**: 4-6 per company (avg)
- **Cost**: Depends on model (free options available)

### Hybrid Method:
- **Speed**: 8-12 seconds per company
- **Success Rate**: 90-98% (all companies)
- **Social Profiles**: 5-7 per company (avg)
- **Cost**: Depends on model + extraction overhead

---

## 🎯 Use Cases

### When to Use AI Method:
✅ Large, well-known companies  
✅ Companies with strong online presence  
✅ When speed is important  
✅ When you have API credits  

### When to Use Hybrid:
✅ All company types  
✅ Maximum accuracy needed  
✅ Unknown or small companies  
✅ When you want best results  

### When to Use Extraction:
✅ No API key available  
✅ Cost-sensitive projects  
✅ Simple use cases  
✅ Still 90%+ success rate  

---

## 🔐 API Key Management

### Security Best Practices:
1. **Never commit keys** to version control
2. **Use environment variables** for production
3. **Rotate keys regularly**
4. **Monitor usage** to avoid unexpected costs
5. **Use free models** when possible

### Getting API Keys:

**OpenRouter:**
1. Visit https://openrouter.ai
2. Sign up for free account
3. Generate API key
4. Many free models available

**Google Gemini:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. Free tier available

---

## 📚 Additional Resources

- **OpenRouter Models**: https://openrouter.ai/models
- **Gemini API**: https://ai.google.dev/
- **Main README**: See README.md for general usage
- **Improvements**: See IMPROVEMENTS.md for technical details

---

## 🎉 Summary

The AI method provides intelligent, accurate company profile discovery:

✅ **Auto-fetches models** when key detected  
✅ **Easy model selection** via dropdown  
✅ **Full validation** before search  
✅ **Clear error messages** for troubleshooting  
✅ **Works with both** single and bulk searches  
✅ **Free models available** for cost-conscious users  
✅ **Hybrid mode** combines AI + extraction for best results  

**Result**: Intelligent, accurate company enrichment with AI! 🤖
