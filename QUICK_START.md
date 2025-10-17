# ⚡ Quick Start Guide - Next.js Version

Get your app running in 5 minutes!

---

## 🚀 Local Development (2 minutes)

```bash
# 1. Navigate to directory
cd nextjs-version

# 2. Install dependencies
npm install

# 3. Create environment file (optional)
cp .env.example .env

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:3000
```

**Done!** Your app is running locally. 🎉

---

## ☁️ Deploy to Vercel (3 minutes)

### Option 1: One-Click Deploy

1. Click: [![Deploy](https://vercel.com/button)](https://vercel.com/new)
2. Sign in with GitHub
3. Import repository
4. Click "Deploy"
5. **Done!** Live in 2 minutes! 🚀

### Option 2: GitHub + Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to vercel.com
# 3. Click "New Project"
# 4. Import your repo
# 5. Click "Deploy"
```

**Your app is live!** 🎉

---

## 📁 Project Structure

```
nextjs-version/
├── pages/
│   ├── api/enrich.ts    # API endpoint
│   └── index.tsx        # Main page
├── styles/
│   └── globals.css      # Styles
├── package.json         # Dependencies
└── vercel.json          # Vercel config
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server

# Deployment
vercel               # Deploy to preview
vercel --prod        # Deploy to production

# Maintenance
npm install          # Install dependencies
npm run lint         # Lint code
```

---

## 🌐 Environment Variables

Create `.env` file:

```bash
OPENROUTER_API_KEY=your_key_here  # Optional
```

**Note**: App works without API key for basic functionality.

---

## 📊 Features

### ✅ What Works

- Single company search
- Bulk CSV/Excel upload
- Social media extraction
- Contact page detection
- Excel export
- Real-time progress
- Mobile responsive

### ⚠️ Limitations

- No AI method (yet)
- Sequential bulk processing
- 10-second Vercel timeout

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Build Errors

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Deployment Issues

1. Check Vercel logs
2. Verify environment variables
3. Test build locally first

---

## 📚 Next Steps

1. ✅ **Customize UI**: Edit `pages/index.tsx`
2. ✅ **Add features**: Create new API routes
3. ✅ **Deploy**: Push to GitHub → Auto-deploy
4. ✅ **Monitor**: Check Vercel analytics
5. ✅ **Scale**: Upgrade plan if needed

---

## 🔗 Resources

- **Full README**: [README.md](README.md)
- **Vercel Deploy**: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
- **Version Compare**: [../VERSION_COMPARISON.md](../VERSION_COMPARISON.md)

---

## 🆘 Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Check Logs**: Vercel Dashboard → Your Project → Logs

---

**You're ready to go!** 🚀

Start with local development, then deploy to Vercel when ready.
