# Scraping Improvements Plan

## Current Issues
1. **searchSocialProfile()** generates/guesses URLs instead of scraping them
2. Returns URLs like `linkedin.com/company/cordialcables` even if they don't exist
3. Not actually extracting from the company's website

## Improvements to Implement

### 1. Remove URL Guessing
- Delete the `searchSocialProfile()` function that generates URLs
- Only return social links that are **actually found** on the website

### 2. Enhanced Website Scraping
- Scrape homepage, contact page, about page, footer
- Look for social media icons and links
- Extract from meta tags (og:url, twitter:site)
- Parse JSON-LD structured data

### 3. Better Validation
- Verify URLs actually exist (HTTP 200)
- Check if it's a real profile (not a share button)
- Validate the URL belongs to the company

### 4. Multi-Page Crawling
- Homepage
- /contact, /about, /about-us
- /impressum (for German sites)
- Footer links

### 5. Structured Data Extraction
- JSON-LD schema
- Open Graph meta tags
- Twitter Card meta tags
