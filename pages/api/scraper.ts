// Enhanced scraper with headless browser support
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import { chromium } from 'playwright-core';
import { scrapeWithCrawlee } from './crawlee-scraper';

interface ScraperOptions {
  useHeadless?: boolean;
  timeout?: number;
  waitForSelector?: string;
}

interface ScrapedData {
  html: string;
  socialLinks: Record<string, string>;
  email: string;
  phone: string;
  success: boolean;
  finalUrl?: string; // Final URL after redirects
}

const SOCIAL_PLATFORMS = {
  linkedin: ['linkedin.com/company/', 'linkedin.com/in/', 'linkedin.com/school/', 'linkedin.com'],
  facebook: ['facebook.com/', 'fb.com/', 'facebook.com', 'fb.com'],
  twitter: ['twitter.com/', 'x.com/', 'twitter.com', 'x.com'],
  instagram: ['instagram.com/', 'instagram.com'],
  youtube: ['youtube.com/channel/', 'youtube.com/c/', 'youtube.com/@', 'youtube.com/user/', 'youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com/@', 'tiktok.com'],
  pinterest: ['pinterest.com/', 'pinterest.com'],
};

// Try to get Chrome executable path
function getChromePath(): string | undefined {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  const fs = require('fs');
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        return path;
      }
    } catch (e) {
      continue;
    }
  }
  
  return undefined;
}

/**
 * Scrape website with Playwright (more reliable than Puppeteer)
 */
export async function scrapeWithPlaywright(url: string, options: ScraperOptions = {}): Promise<ScrapedData> {
  const { timeout = 30000 } = options;
  
  let browser;
  try {
    console.log(`🎭 Launching Playwright browser for: ${url}`);
    
    const chromePath = getChromePath();
    if (!chromePath) {
      console.log('⚠️ Chrome not found, falling back to axios');
      return await scrapeWithAxios(url);
    }

    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
      ],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true, // Ignore SSL errors
    });

    const page = await context.newPage();
    
    // Navigate to page with better strategy
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // Faster than networkidle
      timeout: 60000, // Increase timeout to 60s
    });
    
    // Wait for footer (most sites have it)
    await page.waitForSelector('footer, .footer, #footer', { timeout: 5000 }).catch(() => {
      console.log('   No footer found, continuing...');
    });
    
    // Wait for JavaScript to execute
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get final URL after redirects
    const finalUrl = page.url();
    if (finalUrl !== url) {
      console.log(`   🔄 Redirected to: ${finalUrl}`);
    }
    
    // Extract social links directly from page (better than HTML parsing)
    const socialLinks = await page.evaluate(() => {
      const result: Record<string, string> = {};
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        const fullHref = href.startsWith('http') ? href : new URL(href, window.location.href).toString();
        const lowerHref = fullHref.toLowerCase();
        
        // Extract social links
        if (!result.linkedin && lowerHref.includes('linkedin.com/company/')) {
          result.linkedin = fullHref.split('?')[0];
        } else if (!result.facebook && lowerHref.includes('facebook.com/') && !lowerHref.includes('/sharer')) {
          result.facebook = fullHref.split('?')[0];
        } else if (!result.twitter && (lowerHref.includes('twitter.com/') || lowerHref.includes('x.com/')) && !lowerHref.includes('/intent')) {
          result.twitter = fullHref.split('?')[0];
        } else if (!result.instagram && lowerHref.includes('instagram.com/') && !lowerHref.includes('/share')) {
          result.instagram = fullHref.split('?')[0];
        } else if (!result.youtube && lowerHref.includes('youtube.com/')) {
          result.youtube = fullHref.split('?')[0];
        } else if (!result.tiktok && lowerHref.includes('tiktok.com/@')) {
          result.tiktok = fullHref.split('?')[0];
        } else if (!result.pinterest && lowerHref.includes('pinterest.com/')) {
          result.pinterest = fullHref.split('?')[0];
        }
      }
      
      return result;
    });
    
    // Get the HTML content for email/phone extraction
    const html = await page.content();
    const { email, phone } = extractContactInfo(html);
    
    await browser.close();
    
    console.log(`✅ Playwright scraping successful for ${url}`);
    console.log(`   Found ${Object.keys(socialLinks).length} social links`);
    
    return {
      html,
      socialLinks,
      email,
      phone,
      success: true,
      finalUrl, // Return final URL after redirects
    };
    
  } catch (error: any) {
    console.error(`❌ Playwright scraping failed for ${url}:`, error.message);
    
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    // Fallback to axios
    console.log('⚠️ Falling back to axios scraping');
    return await scrapeWithAxios(url);
  }
}

/**
 * Scrape website with headless browser (for JavaScript-heavy sites)
 */
export async function scrapeWithBrowser(url: string, options: ScraperOptions = {}): Promise<ScrapedData> {
  const { timeout = 30000, waitForSelector } = options;
  
  let browser;
  try {
    console.log(`🌐 Launching headless browser for: ${url}`);
    
    const chromePath = getChromePath();
    if (!chromePath) {
      console.log('⚠️ Chrome not found, falling back to axios');
      return await scrapeWithAxios(url);
    }

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--ignore-certificate-errors', // Ignore SSL certificate errors
        '--ignore-certificate-errors-spki-list',
      ],
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    });
    
    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
        console.log(`Selector ${waitForSelector} not found, continuing anyway`);
      });
    }
    
    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the HTML content
    const html = await page.content();
    
    // Extract social links and contact info
    const socialLinks = extractSocialLinksFromHtml(html, url);
    const { email, phone } = extractContactInfo(html);
    
    console.log(`✅ Browser scraping successful for ${url}`);
    console.log(`   Found ${Object.keys(socialLinks).length} social links`);
    
    return {
      html,
      socialLinks,
      email,
      phone,
      success: true,
    };
    
  } catch (error: any) {
    console.error(`❌ Browser scraping failed for ${url}:`, error.message);
    
    // Fallback to axios
    console.log('⚠️ Falling back to axios scraping');
    return await scrapeWithAxios(url);
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape website source code directly (view-source method)
 * This bypasses JavaScript and gets raw HTML
 */
export async function scrapeSourceCode(url: string): Promise<ScrapedData> {
  try {
    console.log(`📝 Scraping source code: ${url}`);
    
    const https = require('https');
    
    // Remove protocol and add view-source: prefix
    let sourceUrl = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // For view-source, we need the full URL with protocol
      sourceUrl = url;
    }
    
    // Fetch the raw HTML source
    const response = await axios.get(sourceUrl, {
      timeout: 3000, // Reduced to 3s for ultra-fast bulk processing
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      maxRedirects: 10,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    
    const html = response.data;
    
    // Extract social links from raw source
    const socialLinks = extractSocialLinksFromSource(html, url);
    const { email, phone } = extractContactInfoFromSource(html);
    
    console.log(`✅ Source code scraping successful for ${url}`);
    console.log(`   Found ${Object.keys(socialLinks).length} social links from source`);
    
    return {
      html,
      socialLinks,
      email,
      phone,
      success: true,
    };
    
  } catch (error: any) {
    console.error(`❌ Source code scraping failed for ${url}:`, error.message);
    return {
      html: '',
      socialLinks: {},
      email: 'Not found',
      phone: 'Not found',
      success: false,
    };
  }
}

/**
 * Scrape website with axios (for static sites)
 */
export async function scrapeWithAxios(url: string): Promise<ScrapedData> {
  try {
    console.log(`📄 Scraping with axios: ${url}`);
    
    const https = require('https');
    const response = await axios.get(url, {
      timeout: 3000, // Reduced to 3s for ultra-fast bulk processing
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 10,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Ignore SSL certificate errors
      }),
    });
    
    const html = response.data;
    const socialLinks = extractSocialLinksFromHtml(html, url);
    const { email, phone } = extractContactInfo(html);
    
    console.log(`✅ Axios scraping successful for ${url}`);
    console.log(`   Found ${Object.keys(socialLinks).length} social links`);
    
    return {
      html,
      socialLinks,
      email,
      phone,
      success: true,
    };
    
  } catch (error: any) {
    console.error(`❌ Axios scraping failed for ${url}:`, error.message);
    return {
      html: '',
      socialLinks: {},
      email: 'Not found',
      phone: 'Not found',
      success: false,
    };
  }
}

/**
 * Smart scraper - uses Crawlee for production-ready scraping
 * Falls back to Playwright and Axios if needed
 */
export async function smartScrape(url: string, options: ScraperOptions = {}): Promise<ScrapedData> {
  const { useHeadless = true } = options;
  
  if (!useHeadless) {
    // If headless disabled, use axios only
    return await scrapeWithAxios(url);
  }
  
  // Try axios first (fastest - 1-2 seconds)
  const axiosResult = await scrapeWithAxios(url);
  
  // If axios found good data, return it
  if (axiosResult.success && Object.keys(axiosResult.socialLinks).length > 0) {
    console.log('✅ Axios found data, skipping browser scraping');
    return axiosResult;
  }
  
  // Check if fast mode is enabled (skip slow browser methods)
  const fastMode = process.env.FAST_MODE === 'true';
  
  // In fast mode, skip source code extraction if Axios found nothing (saves 5s per site)
  if (fastMode && !axiosResult.success) {
    console.log('⚡ Fast mode enabled - skipping source code and browser scraping');
    return axiosResult;
  }
  
  // Try source code scraping (raw HTML extraction) only if not in fast mode or Axios had partial success
  let sourceResult: ScrapedData | null = null;
  if (!fastMode || axiosResult.success) {
    try {
      console.log('⚠️ Axios found limited data, trying source code extraction');
      sourceResult = await scrapeSourceCode(url);
      
      if (sourceResult.success && Object.keys(sourceResult.socialLinks).length > 0) {
        console.log(`✅ Source code extraction successful for ${url}`);
        console.log(`   Found ${Object.keys(sourceResult.socialLinks).length} social links`);
        return sourceResult;
      }
    } catch (sourceError: any) {
      console.log(`❌ Source code extraction failed: ${sourceError.message}`);
    }
  }
  
  if (fastMode) {
    console.log('⚡ Fast mode enabled - skipping browser scraping');
    // Return source code result if we have it, otherwise axios result
    return sourceResult && sourceResult.success ? sourceResult : axiosResult;
  }
  
  // Check if Crawlee is enabled (can be disabled for low-memory systems)
  const crawleeEnabled = process.env.ENABLE_CRAWLEE !== 'false';
  
  if (crawleeEnabled) {
    // Use Crawlee (production-ready, built-in retries and anti-blocking)
    try {
      console.log('⚠️ Axios found limited data, trying Crawlee (production scraper)');
      const crawleeResult = await scrapeWithCrawlee(url);
      
      if (crawleeResult.success) {
        console.log(`✅ Crawlee scraping successful for ${url}`);
        console.log(`   Found ${Object.keys(crawleeResult.socialLinks).length} social links`);
        return crawleeResult;
      } else {
        console.log('⚠️ Crawlee completed but found no data, trying Playwright');
      }
    } catch (crawleeError: any) {
      console.log(`❌ Crawlee failed: ${crawleeError.message}, trying Playwright`);
    }
  } else {
    console.log('⚠️ Crawlee disabled (ENABLE_CRAWLEE=false), skipping to Playwright');
  }
  
  // Fallback to Playwright if Crawlee fails (unless fast mode)
  try {
    console.log('⚠️ Trying Playwright as fallback');
    return await scrapeWithPlaywright(url, options);
  } catch (playwrightError) {
    console.log('❌ Playwright also failed, returning best available result');
    return sourceResult && sourceResult.success ? sourceResult : axiosResult;
  }
}

function extractSocialLinksFromHtml(html: string, baseUrl: string): Record<string, string> {
  const $ = cheerio.load(html);
  const socialLinks: Record<string, string> = {};
  
  // Extract from all links
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    
    let fullUrl = href;
    if (href.startsWith('/') && !href.startsWith('//')) {
      try {
        fullUrl = new URL(href, baseUrl).toString();
      } catch (e) {
        return;
      }
    } else if (href.startsWith('//')) {
      fullUrl = 'https:' + href;
    }
    
    // Check each platform
    for (const [platform, patterns] of Object.entries(SOCIAL_PLATFORMS)) {
      if (!socialLinks[platform]) {
        for (const pattern of patterns) {
          if (fullUrl.toLowerCase().includes(pattern)) {
            // Exclude share buttons
            if (fullUrl.includes('/sharer/') || fullUrl.includes('/share/') || 
                fullUrl.includes('/intent/') || fullUrl.includes('/shareArticle')) {
              continue;
            }
            
            const cleanUrl = fullUrl.split('?')[0].split('#')[0];
            socialLinks[platform] = cleanUrl;
            console.log(`   ✓ Found ${platform}: ${cleanUrl}`);
            break;
          }
        }
      }
    }
  });
  
  // Also check meta tags
  $('meta').each((_, element) => {
    const content = $(element).attr('content');
    const property = $(element).attr('property') || '';
    
    if (content && property.includes('og:')) {
      for (const [platform, patterns] of Object.entries(SOCIAL_PLATFORMS)) {
        if (!socialLinks[platform]) {
          for (const pattern of patterns) {
            if (content.toLowerCase().includes(pattern)) {
              const cleanUrl = content.split('?')[0].split('#')[0];
              socialLinks[platform] = cleanUrl;
              console.log(`   ✓ Found ${platform} in meta: ${cleanUrl}`);
              break;
            }
          }
        }
      }
    }
  });
  
  return socialLinks;
}

function extractContactInfo(html: string): { email: string; phone: string } {
  const $ = cheerio.load(html);
  let email = 'Not found';
  let phone = 'Not found';
  
  // Extract email from mailto links
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && email === 'Not found') {
      const extractedEmail = href.replace('mailto:', '').split('?')[0].trim();
      if (extractedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        email = extractedEmail;
        return false;
      }
    }
  });
  
  // Extract phone from tel links
  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && phone === 'Not found') {
      phone = href.replace('tel:', '').trim();
      return false;
    }
  });
  
  return { email, phone };
}

/**
 * Extract social links from raw HTML source code using regex
 * More aggressive extraction that works on raw source
 */
function extractSocialLinksFromSource(html: string, baseUrl: string): Record<string, string> {
  const socialLinks: Record<string, string> = {};
  
  // Regex patterns for finding social media URLs in source code
  const patterns = {
    linkedin: /https?:\/\/(www\.)?linkedin\.com\/(company|in|school)\/[a-zA-Z0-9_-]+/gi,
    facebook: /https?:\/\/(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9._-]+/gi,
    twitter: /https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/gi,
    instagram: /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+/gi,
    youtube: /https?:\/\/(www\.)?youtube\.com\/(channel|c|user|@)[a-zA-Z0-9_-]+/gi,
    tiktok: /https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+/gi,
    pinterest: /https?:\/\/(www\.)?pinterest\.com\/[a-zA-Z0-9_]+/gi,
  };
  
  // Extract URLs using regex
  for (const [platform, pattern] of Object.entries(patterns)) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      // Get first match and clean it
      let url = matches[0];
      
      // Exclude share/sharer URLs
      if (url.includes('/sharer/') || url.includes('/share/') || 
          url.includes('/intent/') || url.includes('/shareArticle')) {
        continue;
      }
      
      // Clean URL (remove query params and fragments)
      url = url.split('?')[0].split('#')[0];
      
      socialLinks[platform] = url;
      console.log(`   ✓ Found ${platform} in source: ${url}`);
    }
  }
  
  return socialLinks;
}

/**
 * Extract contact info from raw HTML source using regex
 */
function extractContactInfoFromSource(html: string): { email: string; phone: string } {
  let email = 'Not found';
  let phone = 'Not found';
  
  // Extract email using regex
  const emailPattern = /mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const emailMatch = html.match(emailPattern);
  if (emailMatch && emailMatch[1]) {
    email = emailMatch[1].trim();
    console.log(`   ✓ Found email in source: ${email}`);
  }
  
  // Extract phone using regex
  const phonePattern = /tel:([+\d\s()-]+)/i;
  const phoneMatch = html.match(phonePattern);
  if (phoneMatch && phoneMatch[1]) {
    phone = phoneMatch[1].trim();
    console.log(`   ✓ Found phone in source: ${phone}`);
  }
  
  return { email, phone };
}
