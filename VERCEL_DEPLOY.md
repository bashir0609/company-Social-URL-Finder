# 🚀 Vercel Deployment Guide

Complete guide to deploy your Company Social URL Finder to Vercel.

---

## ⚡ Quick Deploy (5 Minutes)

### Method 1: One-Click Deploy

1. Click this button:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/company-social-finder)

2. Sign in to Vercel with GitHub
3. Click "Deploy"
4. Wait 2-3 minutes
5. Done! Your app is live! 🎉

---

## 📋 Method 2: Manual Deploy (Recommended)

### Step 1: Prepare Your Code

```bash
cd nextjs-version

# Install dependencies
npm install

# Test locally
npm run dev

# Build to verify
npm run build
```

### Step 2: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Next.js version ready for Vercel"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/company-social-finder.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (or `nextjs-version` if in subfolder)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Environment Variables** (Optional)
   - Click "Environment Variables"
   - Add: `OPENROUTER_API_KEY` = `your_key_here`
   - Click "Add"

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

### Step 4: Access Your App

Your app will be available at:
```
https://your-project-name.vercel.app
```

Or custom domain:
```
https://your-custom-domain.com
```

---

## 🔧 Configuration

### Vercel Settings

#### Project Settings
- **Framework**: Next.js
- **Node Version**: 18.x (recommended)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Environment Variables
```
OPENROUTER_API_KEY=your_api_key_here
```

To add environment variables:
1. Go to Project Settings
2. Click "Environment Variables"
3. Add variable name and value
4. Select environment (Production, Preview, Development)
5. Click "Save"

---

## 🌐 Custom Domain

### Add Custom Domain

1. **In Vercel Dashboard**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add"
   - Enter your domain: `example.com`

2. **Configure DNS**
   
   **Option A: Vercel Nameservers (Recommended)**
   - Copy Vercel nameservers
   - Update at your domain registrar
   - Wait for DNS propagation (5-60 minutes)

   **Option B: CNAME Record**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: www (or @)
     Value: cname.vercel-dns.com
     ```

3. **Verify**
   - Vercel will auto-verify
   - SSL certificate auto-generated
   - Domain is live! 🎉

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 📊 Monitoring & Analytics

### View Deployment Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Click "Deployments"
4. Click on specific deployment
5. View "Build Logs" and "Function Logs"

### Analytics

Vercel provides:
- **Web Analytics**: Page views, visitors
- **Speed Insights**: Performance metrics
- **Function Logs**: API endpoint logs

Enable in Project Settings → Analytics

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Module not found`
```bash
# Solution: Install missing dependencies
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error**: `Build exceeded maximum duration`
```bash
# Solution: Optimize build
# Remove unused dependencies
# Check for infinite loops in build
```

### Runtime Errors

**Error**: `Function execution timed out`
- Vercel has 10-second timeout for Hobby plan
- Optimize API calls
- Consider upgrading to Pro plan (60s timeout)

**Error**: `Module not found in production`
- Check dependencies are in `dependencies`, not `devDependencies`
- Rebuild and redeploy

### Environment Variables Not Working

1. Check variable name matches code
2. Redeploy after adding variables
3. Check variable is set for correct environment

---

## 💰 Pricing

### Hobby Plan (Free)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ⚠️ 10-second function timeout
- ⚠️ 1 concurrent build

### Pro Plan ($20/month)
- ✅ Everything in Hobby
- ✅ 1 TB bandwidth/month
- ✅ 60-second function timeout
- ✅ 3 concurrent builds
- ✅ Advanced analytics
- ✅ Password protection

### Enterprise
- Custom pricing
- Dedicated support
- SLA guarantees
- Advanced security

**Recommendation**: Start with Hobby (free), upgrade if needed.

---

## 🚀 Performance Optimization

### Edge Functions

Vercel runs your functions on the edge (close to users):
- Faster response times
- Global distribution
- Automatic scaling

### Caching

Next.js automatically caches:
- Static pages
- API responses (with proper headers)
- Images

### Image Optimization

Use Next.js Image component:
```tsx
import Image from 'next/image'

<Image 
  src="/logo.png" 
  width={200} 
  height={100} 
  alt="Logo"
/>
```

---

## 🔐 Security

### Environment Variables

- Never commit `.env` to Git
- Use Vercel environment variables
- Rotate API keys regularly

### HTTPS

- Automatic SSL certificates
- Force HTTPS (enabled by default)
- HTTP/2 support

### Headers

Add security headers in `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}
```

---

## 📈 Scaling

### Automatic Scaling

Vercel automatically scales:
- No configuration needed
- Handles traffic spikes
- Global CDN distribution

### Rate Limiting

Implement rate limiting for API routes:
```typescript
// pages/api/enrich.ts
const rateLimit = {
  windowMs: 60000, // 1 minute
  max: 10, // 10 requests per minute
}
```

---

## 🔄 Rollback

### Rollback to Previous Deployment

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find working deployment
4. Click "..." → "Promote to Production"
5. Confirm

### Instant Rollback

```bash
# Using Vercel CLI
vercel rollback
```

---

## 📝 Best Practices

### Development Workflow

1. **Develop locally**: `npm run dev`
2. **Test build**: `npm run build`
3. **Commit changes**: `git commit -am "Feature"`
4. **Push to GitHub**: `git push`
5. **Auto-deploy**: Vercel deploys automatically
6. **Test preview**: Check preview URL
7. **Merge to main**: Deploy to production

### Branch Strategy

- `main` → Production
- `develop` → Staging/Preview
- `feature/*` → Feature previews

### Environment Strategy

- **Production**: Live app
- **Preview**: Pull request previews
- **Development**: Local development

---

## 🎯 Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Single search works
- [ ] Bulk upload works
- [ ] Export functionality works
- [ ] All links are clickable
- [ ] Mobile responsive
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled
- [ ] Environment variables set
- [ ] SSL certificate active

---

## 🆘 Support

### Vercel Support

- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Status**: [vercel-status.com](https://www.vercel-status.com)

### Common Issues

- **Build fails**: Check build logs
- **Function timeout**: Optimize code or upgrade plan
- **Domain not working**: Check DNS settings
- **Environment variables**: Redeploy after adding

---

## ✅ Success Checklist

Your deployment is successful when:

- ✅ App is accessible via public URL
- ✅ All features work correctly
- ✅ No errors in function logs
- ✅ Performance is acceptable
- ✅ SSL certificate is active
- ✅ Custom domain works (if configured)

---

## 🎉 You're Live!

Congratulations! Your Company Social URL Finder is now live on Vercel!

**Share your app**:
```
https://your-app.vercel.app
```

**Next steps**:
1. Share with users
2. Monitor analytics
3. Gather feedback
4. Iterate and improve

---

**Happy deploying!** 🚀
