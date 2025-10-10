# 🔍 Company Social URL Finder - Next.js Version

A modern Next.js application that finds official social media profiles and contact pages for any company. Built with React, TypeScript, and Tailwind CSS - **optimized for Vercel deployment**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bashir0609/company-social-finder)

---

## ✨ Features

- **Single Company Search**: Find social URLs for one company at a time
- **Bulk Processing**: Upload CSV/Excel files to enrich multiple companies
- **Real-time Processing**: See results as they're found
- **Export Results**: Download results as Excel files
- **Modern UI**: Built with Tailwind CSS and Lucide icons
- **Fully Responsive**: Works on desktop, tablet, and mobile
- **Serverless**: Runs on Vercel's edge network

### Social Media Coverage
- LinkedIn
- Facebook
- Twitter/X
- Instagram
- YouTube
- TikTok
- Pinterest
- GitHub

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

Edit `.env` and add your OpenRouter API key (optional for basic functionality):
```
OPENROUTER_API_KEY=your_api_key_here
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
nextjs-version/
├── pages/
│   ├── api/
│   │   └── enrich.ts          # API endpoint for enrichment
│   ├── _app.tsx                # App wrapper
│   ├── _document.tsx           # Document structure
│   └── index.tsx               # Main page
├── styles/
│   └── globals.css             # Global styles
├── public/                     # Static files
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
├── next.config.js              # Next.js config
└── vercel.json                 # Vercel config
```

---

## 🔧 How It Works

### Single Company Search
1. Enter company name or website URL
2. Click "Find Social URLs"
3. API fetches website and extracts social links
4. Results displayed with clickable links

### Bulk Enrichment
1. Upload CSV or Excel file with company names
2. Click "Start Bulk Enrichment"
3. Each company is processed sequentially
4. Download results as Excel file

### API Endpoint
- **POST** `/api/enrich`
- **Body**: `{ company: string, method: 'extraction' }`
- **Response**: Enrichment result with all social URLs

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

## 🔐 API Key Configuration

### User-Provided API Key (Recommended)

Users can enter their OpenRouter API key directly in the app interface:
- ✅ No server configuration needed
- ✅ Each user uses their own key
- ✅ More secure (keys not stored on server)
- ✅ Works immediately after deployment

### Environment Variable (Optional)

Alternatively, set a default API key in Vercel:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Default OpenRouter API key | No |

**Note**: The app works without API key for basic web scraping. API key only needed for AI-enhanced search (future feature).

---

## 📊 API Usage

### Enrich Single Company

```typescript
const response = await fetch('/api/enrich', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company: 'Microsoft',
    method: 'extraction'
  })
});

const result = await response.json();
console.log(result);
```

### Response Format

```json
{
  "company_name": "Microsoft",
  "website": "https://microsoft.com",
  "contact_page": "https://microsoft.com/contact",
  "linkedin": "https://linkedin.com/company/microsoft",
  "facebook": "https://facebook.com/Microsoft",
  "twitter": "https://twitter.com/Microsoft",
  "instagram": "https://instagram.com/microsoft",
  "youtube": "https://youtube.com/@Microsoft",
  "tiktok": "Not found",
  "pinterest": "Not found",
  "github": "https://github.com/microsoft",
  "status": "Success"
}
```

---

## 🎯 Features Comparison

| Feature | Streamlit Version | Next.js Version |
|---------|------------------|-----------------|
| **Single Search** | ✅ | ✅ |
| **Bulk Upload** | ✅ | ✅ |
| **AI Method** | ✅ | ⚠️ Partial |
| **Extraction Method** | ✅ | ✅ |
| **Export Excel** | ✅ | ✅ |
| **Vercel Deploy** | ❌ | ✅ |
| **Serverless** | ❌ | ✅ |
| **Modern UI** | ⚠️ Basic | ✅ Advanced |
| **Mobile Responsive** | ⚠️ Limited | ✅ Full |

---

## 🚀 Performance

- **Cold Start**: ~1-2 seconds (Vercel serverless)
- **Single Search**: ~3-5 seconds per company
- **Bulk Processing**: Sequential (1 company at a time)
- **Max Request Time**: 10 seconds (Vercel limit)

### Optimization Tips
- Use bulk processing for multiple companies
- Results are processed client-side for better UX
- Serverless functions scale automatically

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### API Timeout
- Vercel has 10-second timeout for serverless functions
- Some websites may take longer to fetch
- Consider implementing retry logic

### CORS Issues
- Next.js API routes handle CORS automatically
- No additional configuration needed

---

## 🔄 Differences from Streamlit Version

### Advantages
- ✅ **Vercel Compatible**: Runs on Vercel's serverless platform
- ✅ **Better Performance**: Faster page loads, edge optimization
- ✅ **Modern UI**: Tailwind CSS, responsive design
- ✅ **Scalable**: Serverless functions scale automatically
- ✅ **SEO Friendly**: Next.js provides better SEO

### Limitations
- ⚠️ **No AI Method**: OpenRouter integration simplified
- ⚠️ **Sequential Processing**: Bulk processing is slower
- ⚠️ **10s Timeout**: Vercel serverless function limit

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

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

---

## 📧 Support

For issues or questions:
- Check Vercel deployment logs
- Review browser console for errors
- Test API endpoint directly: `/api/enrich`

---

## 🎉 Success!

Your Next.js version is ready to deploy to Vercel! 

**Quick Deploy**: Push to GitHub → Connect to Vercel → Deploy! 🚀

---

**Made with ❤️ using Next.js | Optimized for Vercel**
