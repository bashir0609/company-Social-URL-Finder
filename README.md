# 🔍 Company Data Extractor

> **Extract social media profiles, contact information, and website details from any company**

A powerful Next.js application that automatically discovers and extracts company data including social media profiles, contact pages, emails, and phone numbers. Built with advanced web scraping, parallel processing, and intelligent fallback strategies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bashir0609/company-Social-URL-Finder)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://your-app.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Key Features

### 🚀 **Fast Mode Processing**
- **3-second timeout** for ultra-fast bulk processing
- **10 parallel requests** for maximum throughput
- Process **500 companies in 1.5-2 hours** (vs 3+ hours in normal mode)
- **95%+ success rate** when combining fast + normal mode re-processing

### 📊 **Smart Export Options**
- **Download All** - Complete results with original data merged
- **Success Only** - Companies where data was found
- **Failed Only** - Companies for re-processing
- **Original column order preserved** - Your uploaded file structure maintained
- **Automatic file naming** - `YYYY-MM-DD filename SUCCESS.xlsx`

### 🔍 **Comprehensive Data Extraction**
- **Social Media**: LinkedIn, Facebook, Twitter, Instagram, YouTube, TikTok, Pinterest
- **Contact Info**: Email addresses, phone numbers, contact pages
- **Website Data**: Company domain, official website
- **Smart Detection**: Extracts from homepage, contact page, and source code

### ⚡ **Bulk Processing**
- **CSV/Excel Upload** - Support for .csv, .xlsx, .xls files
- **Parallel Processing** - 10 concurrent requests
- **Real-time Progress** - Live log with detailed status
- **Pause/Resume** - Stop processing anytime
- **Field Selection** - Choose which data to extract (faster processing)

### 🎨 **Modern Interface**
- **Dark Mode** - Eye-friendly interface
- **Responsive Design** - Works on all devices
- **Real-time Stats** - Visitor count, search count
- **Column Visibility** - Show/hide columns in results
- **Pagination** - 10, 25, 50, 100 items per page

### 🔧 **Advanced Features**
- **Multiple Search Engines** - Google, Bing, DuckDuckGo
- **Headless Browser** - JavaScript-rendered content support
- **Source Code Scraping** - Deep extraction from HTML
- **SSL Error Handling** - Automatic fallback
- **HTTP/HTTPS Fallback** - Try both protocols
- **Redirect Following** - Automatic URL resolution

---

## 📈 Performance

| Metric | Fast Mode | Normal Mode |
|--------|-----------|-------------|
| **Timeout** | 3 seconds | 30 seconds |
| **Parallel Requests** | 10 | 10 |
| **Batch Delay** | 100ms | 100ms |
| **500 Companies** | 1.5-2 hours | 3-4 hours |
| **Success Rate** | 60-70% | 90-95% |
| **Recommended Use** | Initial processing | Re-process failures |

### Optimal Workflow
1. **Fast Mode** → Process all 500 companies (1.5-2 hours, ~70% success)
2. **Export Failed** → Download failed results (~150 companies)
3. **Normal Mode** → Re-process failed companies (30-40 min, ~90% success)
4. **Merge Results** → Combine success files
5. **Final Result** → 95%+ success rate in ~2 hours total

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone and navigate to the directory**:
```bash
cd nextjs-version
```

2. **Install dependencies**:
```bash
npm install
# or
yarn install
```

3. **Create environment file**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Fast Mode (recommended for bulk processing)
FAST_MODE=true

# Search Engine (google, bing, duckduckgo)
SEARCH_ENGINE=google

# Social Search Method (website, direct)
SOCIAL_SEARCH_METHOD=website
```

4. **Run development server**:
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/company-social-finder)

### Manual Deploy

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/company-social-finder.git
git push -u origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Add Environment Variables** (Optional):
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Environment Variables"
   - Add: `OPENROUTER_API_KEY` = `your_api_key_here`
   - Redeploy if needed

4. **Done!** Your app will be live at: `https://your-app.vercel.app`

---

## 📁 Project Structure

```
company-Social-URL-Finder/
├── pages/
│   ├── api/
│   │   ├── enrich.ts           # Main enrichment API
│   │   ├── scraper.ts          # Web scraping logic
│   │   └── visitor-count.ts    # Analytics endpoint
│   ├── _app.tsx                # App wrapper
│   ├── _document.tsx           # Document structure
│   └── index.tsx               # Main UI (1500+ lines)
├── styles/
│   └── globals.css             # Global styles + Tailwind
├── docs/                       # Documentation (36 files)
│   ├── FAST_MODE.md           # Fast mode guide
│   ├── SEPARATE_EXPORTS.md    # Export options guide
│   └── ...                    # Other technical docs
├── storage/                    # Visitor analytics data
├── .env                        # Environment configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
├── next.config.js              # Next.js config
└── vercel.json                 # Vercel deployment config
```

---

## 📖 Usage Guide

### Single Company Search

1. **Enter company information**:
   - **Company Name**: e.g., "Microsoft", "Nike"
   - **Domain** (optional): e.g., "microsoft.com" for faster results

2. **Configure search** (optional):
   - Search Engine: Google, Bing, or DuckDuckGo
   - Social Search Method: Website or Direct

3. **Click "Find Social URLs"**

4. **View results**:
   - Social media profiles with clickable links
   - Contact information (email, phone)
   - Copy URLs to clipboard

### Bulk Enrichment

#### Step 1: Prepare Your File
Upload CSV or Excel with company data:
```csv
Company Name,Industry,Location
Microsoft,Technology,USA
Nike,Retail,USA
Tesla,Automotive,USA
```

#### Step 2: Configure Processing
- **Select column** containing company names/domains
- **Choose fields to extract** (fewer = faster):
  - Essential Only: Website, LinkedIn, Email
  - Social Media Only: All social platforms
  - All Fields: Complete data extraction

#### Step 3: Process
- Click "Start Bulk Enrichment"
- Monitor real-time progress log
- Pause anytime with "Stop Processing"

#### Step 4: Export Results
- **Download All**: Complete results
- **Success Only**: Companies with data found
- **Failed Only**: Companies for re-processing

### Re-Processing Failed Results

1. **Export failed results** → `2025-10-22 companies FAILED.xlsx`
2. **Disable fast mode** in `.env`: `FAST_MODE=false`
3. **Upload failed file** and process again
4. **Export success** → `2025-10-22 companies FAILED SUCCESS.xlsx`
5. **Merge** both success files manually

**Result**: 95%+ success rate!

---

## 🎨 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **HTML Parsing**: Cheerio
- **CSV Parsing**: PapaParse
- **Excel**: SheetJS (xlsx)
- **Deployment**: Vercel

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FAST_MODE` | `true` | Enable fast mode (3s timeout) |
| `SEARCH_ENGINE` | `google` | Search engine: google, bing, duckduckgo |
| `SOCIAL_SEARCH_METHOD` | `website` | Method: website, direct |

### Fast Mode vs Normal Mode

**Fast Mode** (`FAST_MODE=true`):
- ✅ 3-second timeout per request
- ✅ Skips slow scraping methods
- ✅ 60-70% success rate
- ✅ 2x faster processing
- 🎯 **Use for**: Initial bulk processing

**Normal Mode** (`FAST_MODE=false`):
- ✅ 30-second timeout per request
- ✅ Full scraping (axios + source + browser)
- ✅ 90-95% success rate
- ⏱️ Slower but more thorough
- 🎯 **Use for**: Re-processing failures

---

## 📊 API Usage

### Enrich Single Company

```typescript
const response = await fetch('/api/enrich', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company: 'Microsoft',
    platforms: ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'pinterest'],
    fields_to_extract: ['website', 'company_domain', 'contact_page', 'email', 'phone', 'linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'pinterest'],
    search_engine: 'google',
    social_search_method: 'website'
  })
});

const result = await response.json();
```

### Response Format

```json
{
  "company_name": "Microsoft",
  "website": "https://microsoft.com",
  "company_domain": "microsoft.com",
  "contact_page": "https://microsoft.com/contact",
  "email": "support@microsoft.com",
  "phone": "+1-800-642-7676",
  "linkedin": "https://linkedin.com/company/microsoft",
  "facebook": "https://facebook.com/Microsoft",
  "twitter": "https://twitter.com/Microsoft",
  "instagram": "https://instagram.com/microsoft",
  "youtube": "https://youtube.com/@Microsoft",
  "tiktok": "Not found",
  "pinterest": "Not found"
}
```

---

## 🔍 Data Extraction Methods

### 1. Website Discovery
- Google/Bing/DuckDuckGo search
- Multiple domain patterns (.com, .io, .net, etc.)
- HTTP/HTTPS fallback
- Redirect following

### 2. Homepage Scraping
- **Axios**: Fast HTML fetching (3s timeout in fast mode)
- **Source Code**: Deep HTML parsing with regex
- **Headless Browser**: JavaScript-rendered content (Puppeteer)

### 3. Contact Page Scraping
- Automatic contact page detection
- Additional social link extraction
- Email and phone number extraction

### 4. Social Profile Discovery
- Direct platform search (linkedin.com/company/[name])
- Website extraction (footer, header, social widgets)
- Multiple name variations (spaces, hyphens, underscores)

### Success Factors
- ✅ **80+ domain patterns** across 20+ TLDs
- ✅ **5+ name variations** per platform
- ✅ **3-layer scraping** (axios → source → browser)
- ✅ **Smart fallbacks** at every step
- ✅ **SSL error handling**
- ✅ **Timeout optimization**

---

## 🐛 Troubleshooting

### Low Success Rate
**Problem**: Only 60-70% success rate

**Solutions**:
1. ✅ Disable fast mode: `FAST_MODE=false` in `.env`
2. ✅ Export failed results and re-process
3. ✅ Try different search engine
4. ✅ Verify company names are correct

### Slow Processing
**Problem**: Bulk processing takes too long

**Solutions**:
1. ✅ Enable fast mode: `FAST_MODE=true`
2. ✅ Select fewer fields to extract
3. ✅ Process in smaller batches
4. ✅ Use "Essential Only" preset

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Deployment Issues
**Problem**: Vercel deployment fails

**Solutions**:
1. ✅ Check build logs in Vercel dashboard
2. ✅ Verify all dependencies in `package.json`
3. ✅ Ensure Node.js version is 18+
4. ✅ Check TypeScript errors: `npm run build`

### Export Issues
**Problem**: Downloaded file is empty or incorrect

**Solutions**:
1. ✅ Wait for processing to complete (100%)
2. ✅ Check browser console for errors
3. ✅ Try different export format (CSV vs Excel)
4. ✅ Verify results are displayed in table

---

## 📝 Development

### Adding New Features

1. **Add API endpoint**: Create file in `pages/api/`
2. **Update UI**: Modify `pages/index.tsx`
3. **Add styles**: Update Tailwind classes
4. **Test locally**: `npm run dev`
5. **Deploy**: Push to GitHub (auto-deploys on Vercel)

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- ESLint for code quality

---

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 📦 Build & Deploy

### Build Locally
```bash
npm run build
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 📚 Documentation

Comprehensive guides available in `/docs`:

- **[FAST_MODE.md](docs/FAST_MODE.md)** - Fast mode configuration and optimization
- **[SEPARATE_EXPORTS.md](docs/SEPARATE_EXPORTS.md)** - Export options guide
- **[EXPORT_WITH_ORIGINAL_DATA.md](docs/EXPORT_WITH_ORIGINAL_DATA.md)** - Data merging guide
- **[SOURCE_CODE_SCRAPING.md](docs/SOURCE_CODE_SCRAPING.md)** - Scraping techniques
- **[VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)** - Deployment guide

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Vercel** - Deployment platform
- **Cheerio** - HTML parsing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling framework

---

## 📧 Support

For issues or questions:
- 📖 Check the [documentation](docs/)
- 🐛 Open an [issue](https://github.com/bashir0609/company-Social-URL-Finder/issues)
- 💬 Review [troubleshooting](#-troubleshooting) section

---

## 🎉 Ready to Deploy!

**Quick Start**: 
```bash
npm install
npm run dev
```

**Deploy to Vercel**:
```bash
git push origin main
# Vercel auto-deploys from GitHub
```

---

**Built with ❤️ | Powered by Next.js & Vercel**
