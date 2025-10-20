import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SOCIAL_PLATFORMS = {
  linkedin: ['linkedin.com/company/', 'linkedin.com/in/', 'linkedin.com/school/', 'linkedin.com'],
  facebook: ['facebook.com/', 'fb.com/', 'facebook.com', 'fb.com'],
  twitter: ['twitter.com/', 'x.com/', 'twitter.com', 'x.com'],
  instagram: ['instagram.com/', 'instagram.com'],
  youtube: ['youtube.com/channel/', 'youtube.com/c/', 'youtube.com/@', 'youtube.com/user/', 'youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com/@', 'tiktok.com'],
  pinterest: ['pinterest.com/', 'pinterest.com'],
  github: ['github.com/', 'github.com'],
  discord: ['discord.gg/', 'discord.com/invite/', 'discord.com'],
};

interface EnrichResult {
  company_name: string;
  website: string;
  company_domain: string;
  contact_page: string;
  email: string;
  phone: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  pinterest: string;
}

// Multiple user agents to rotate through for better success rate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

async function fetchPageContent(url: string, retries = 3): Promise<string | null> {
  let userAgent = USER_AGENTS[0]; // Default user agent
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Rotate user agents for better success rate
      userAgent = USER_AGENTS[attempt % USER_AGENTS.length];
      
      const response = await axios.get(url, {
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,de;q=0.8,fr;q=0.7,es;q=0.6',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        maxRedirects: 10, // Allow more redirects
        validateStatus: (status) => status < 500, // Accept 4xx errors, retry only on 5xx
        decompress: true, // Auto decompress gzip/deflate
      });
      
      // Check if we got valid HTML content
      if (response.data && typeof response.data === 'string' && response.data.length > 100) {
        return response.data;
      }
      
      console.log(`Attempt ${attempt + 1}: Got response but content too short or invalid`);
      
    } catch (error: any) {
      const errorMsg = error.response?.status 
        ? `HTTP ${error.response.status}` 
        : error.code === 'ECONNABORTED' 
        ? 'Timeout' 
        : error.code || error.message;
      
      console.error(`Error fetching ${url} (attempt ${attempt + 1}/${retries}): ${errorMsg}`);
      
      // Don't retry SSL certificate errors - they won't be fixed by retrying
      const sslErrors = ['DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'];
      if (sslErrors.includes(error.code)) {
        console.log('SSL certificate error - skipping retries');
        return null;
      }
      
      // If it's a 404 or 403, don't retry
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log('Got 404/403, trying with www/non-www variant...');
        
        // Try alternate URL (add/remove www)
        try {
          const urlObj = new URL(url);
          const altUrl = urlObj.hostname.startsWith('www.') 
            ? url.replace('www.', '')
            : url.replace('://', '://www.');
          
          if (altUrl !== url) {
            console.log(`Trying alternate URL: ${altUrl}`);
            const altResponse = await axios.get(altUrl, {
              timeout: 30000,
              headers: { 'User-Agent': userAgent },
              maxRedirects: 10,
              validateStatus: (status) => status < 500,
            });
            if (altResponse.data && typeof altResponse.data === 'string') {
              return altResponse.data;
            }
          }
        } catch (altError) {
          console.log('Alternate URL also failed');
        }
        
        return null; // Don't retry 404/403
      }
      
      if (attempt < retries - 1) {
        // Reduced delays for faster bulk processing: wait 500ms, 1s
        const waitTime = Math.pow(2, attempt) * 500;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  return null;
}

function extractCompanyName(html: string, fallbackDomain: string): string {
  const $ = cheerio.load(html);
  
  // Generic phrases and errors that are NOT company names
  const invalidPhrases = [
    'stay tuned', 'coming soon', 'under construction', 'welcome', 'home page',
    'loading', 'please wait', 'redirecting', 'homepage', 'main page',
    // HTTP errors
    '403', '404', '500', '502', '503', 'forbidden', 'not found', 'error',
    'access denied', 'unauthorized', 'bad gateway', 'service unavailable',
    // Generic page titles
    'untitled', 'new page', 'default', 'index', 'test page', 'company'
  ];
  
  const isValidCompanyName = (name: string): boolean => {
    if (!name || name.length < 2 || name.length > 100) return false;
    const lowerName = name.toLowerCase();
    
    // Check for invalid phrases
    if (invalidPhrases.some(phrase => lowerName.includes(phrase))) return false;
    
    // Check if it's mostly numbers (like "403" or "404 error")
    const digitCount = (name.match(/\d/g) || []).length;
    if (digitCount > name.length / 2) return false;
    
    // Check if it contains common error patterns
    if (/^\d{3}\s*[-–—]\s*/i.test(name)) return false; // "403 - Forbidden"
    
    return true;
  };
  
  let companyName = '';
  let source = '';
  
  // 1. Meta property og:site_name (most reliable)
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  if (ogSiteName && isValidCompanyName(ogSiteName)) {
    companyName = ogSiteName;
    source = 'og:site_name';
  }
  
  // 2. Meta name application-name
  if (!companyName) {
    const appName = $('meta[name="application-name"]').attr('content');
    if (appName && isValidCompanyName(appName)) {
      companyName = appName;
      source = 'application-name';
    }
  }
  
  // 3. Brand/company name in header/nav
  if (!companyName) {
    const brandSelectors = [
      '.navbar-brand', '.brand', '.site-title', '.company-name', 
      '.logo-text', 'header .name', 'nav .brand-name', '.header-brand'
    ];
    for (const selector of brandSelectors) {
      const brandText = $(selector).first().text().trim();
      if (brandText && isValidCompanyName(brandText) && brandText.length < 50) {
        companyName = brandText;
        source = `brand-element (${selector})`;
        break;
      }
    }
  }
  
  // 4. Logo alt text (often more reliable than title)
  if (!companyName) {
    const logoSelectors = [
      'img[alt*="logo" i]', 'img.logo', '.logo img', '.brand img', 
      '.navbar-brand img', 'header img', '.site-logo img'
    ];
    for (const selector of logoSelectors) {
      const logoAlt = $(selector).first().attr('alt');
      if (logoAlt) {
        const cleanedLogo = logoAlt.replace(/\s*logo\s*/gi, '').trim();
        if (isValidCompanyName(cleanedLogo)) {
          companyName = cleanedLogo;
          source = `logo-alt (${selector})`;
          break;
        }
      }
    }
  }
  
  // 5. H1 tag (if it looks like a company name)
  if (!companyName) {
    const h1 = $('h1').first().text().trim();
    if (h1 && h1.length < 50 && isValidCompanyName(h1)) {
      companyName = h1;
      source = 'h1';
    }
  }
  
  // 6. Title tag (clean it up) - LAST because it's often misleading
  if (!companyName) {
    const title = $('title').text().trim();
    if (title) {
      // Try to extract company name from title
      // Split by common separators and take the first part
      const parts = title.split(/[\|\-–—]/);
      for (const part of parts) {
        const cleaned = part.trim();
        if (isValidCompanyName(cleaned) && cleaned.length >= 3) {
          companyName = cleaned;
          source = 'title';
          break;
        }
      }
    }
  }
  
  // 7. Fallback to formatted domain name (ALWAYS use if nothing else worked)
  if (!companyName || companyName.trim().length === 0) {
    const domainParts = fallbackDomain.split('.');
    const mainPart = domainParts[0];
    companyName = mainPart
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    source = 'domain-fallback';
  }
  
  // Clean up special characters and extra spaces
  companyName = companyName
    .replace(/®|™|©/g, '')  // Remove trademark symbols
    .replace(/\s+/g, ' ')    // Normalize spaces
    .trim();
  
  // Final validation - if still invalid, use domain
  if (!isValidCompanyName(companyName)) {
    const domainParts = fallbackDomain.split('.');
    const mainPart = domainParts[0];
    companyName = mainPart
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    source = 'domain-fallback (after validation)';
  }
  
  console.log(`📝 Company name extracted from ${source}: "${companyName}"`);
  
  return companyName;
}

function extractEmailAndPhone(html: string): { email: string; phone: string } {
  const $ = cheerio.load(html);
  const result = { email: 'Not found', phone: 'Not found' };
  
  // Extract email
  // 1. Look for mailto links
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && result.email === 'Not found') {
      // Decode URL-encoded characters (e.g., %40 -> @, %20 -> space)
      const decodedHref = decodeURIComponent(href);
      const email = decodedHref.replace('mailto:', '').split('?')[0].split('&')[0].trim();
      // Validate email format
      if (email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        result.email = email;
        return false; // break
      }
    }
  });
  
  // 2. Search in HTML content (more targeted)
  if (result.email === 'Not found') {
    // Look in specific areas first (footer, contact sections)
    const targetAreas = $('footer, .contact, .footer, #contact, #footer, [class*="contact"], [class*="footer"]').text();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let emails = targetAreas.match(emailRegex);
    
    // If not found in targeted areas, search entire body
    if (!emails || emails.length === 0) {
      const bodyText = $('body').text();
      emails = bodyText.match(emailRegex);
    }
    
    if (emails && emails.length > 0) {
      // Filter out common non-contact emails and prioritize contact-related emails
      const validEmails = emails.filter((email: string) => 
        !email.toLowerCase().includes('example.com') && 
        !email.toLowerCase().includes('test.com') &&
        !email.toLowerCase().includes('sentry.io') &&
        !email.toLowerCase().includes('wixpress.com') &&
        !email.toLowerCase().includes('noreply') &&
        !email.toLowerCase().includes('no-reply')
      );
      
      // Prioritize emails with contact-related prefixes
      const contactEmail = validEmails.find((email: string) => 
        email.toLowerCase().includes('contact') ||
        email.toLowerCase().includes('info') ||
        email.toLowerCase().includes('hello') ||
        email.toLowerCase().includes('support')
      );
      
      result.email = contactEmail || validEmails[0];
    }
  }
  
  // Extract phone number
  // 1. Look for tel links
  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && result.phone === 'Not found') {
      // Decode URL-encoded characters (e.g., %20 -> space)
      const decodedHref = decodeURIComponent(href);
      const phone = decodedHref.replace('tel:', '').replace(/\s+/g, ' ').trim();
      result.phone = phone;
      return false; // break
    }
  });
  
  // 2. Search in HTML content (more targeted)
  if (result.phone === 'Not found') {
    // Look in specific areas first
    const targetAreas = $('footer, .contact, .footer, #contact, #footer, [class*="contact"], [class*="footer"], [class*="phone"], [class*="hotline"]').text();
    // Multiple phone regex patterns to match various international formats
    const phonePatterns = [
      /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}?\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,  // +1-234-567-8900, (123) 456-7890
      /\d{2,3}[-.\s]?\d{3}[-.\s]?\d{4}/g,  // 123-456-7890
      /\d{4}[-.\s]?\d{3}[-.\s]?\d{3}/g,  // 1234-567-890
      /(\+\d{1,3}[- ]?)?\(?\d{1,4}?\)?[- ]?\d{1,4}[- ]?\d{1,4}[- ]?\d{1,4}/g,  // International formats
      /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-\/]?\d{1,4}[\s.-\/]?\d{1,4}[\s.-\/]?\d{0,4}[\s.-\/]?\d{0,4}/g,  // German format with slashes
    ];
    
    let phones: string[] = [];
    for (const pattern of phonePatterns) {
      const matches = targetAreas.match(pattern);
      if (matches) phones.push(...matches);
    }
    
    // If not found in targeted areas, search entire body
    if (!phones || phones.length === 0) {
      const bodyText = $('body').text();
      for (const pattern of phonePatterns) {
        const matches = bodyText.match(pattern);
        if (matches) phones.push(...matches);
      }
    }
    
    if (phones && phones.length > 0) {
      // Filter to get valid phone numbers (at least 10 digits)
      const validPhones = phones.filter((phone: string) => {
        const digitsOnly = phone.replace(/\D/g, '');
        
        // Basic length check
        if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
        
        // Filter out common fake/placeholder numbers
        // 555 prefix (North American fake numbers)
        if (digitsOnly.includes('555') && digitsOnly.match(/555\d{4}/)) return false;
        
        // Sequential numbers like 123456, 1234567890
        if (/^(0123456789|1234567890|123456789|12345678|1234567|123456)/.test(digitsOnly)) return false;
        
        // Repeating patterns like 111111, 222222, 000000
        if (/^(\d)\1{5,}$/.test(digitsOnly)) return false;
        
        // Common test numbers
        if (digitsOnly === '0000000000' || digitsOnly === '1111111111') return false;
        
        return true;
      });
      
      if (validPhones.length > 0) {
        result.phone = validPhones[0].trim();
      }
    }
  }
  
  return result;
}

function extractKeywords(html: string): string[] {
  const $ = cheerio.load(html);
  
  // Remove script, style, and other non-content tags
  $('script, style, nav, header, footer, iframe, noscript').remove();
  
  // Extract text from important sections with weights
  const titleText = $('title').text() || '';
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
  const h1Text = $('h1').text() || '';
  const h2Text = $('h2').text() || '';
  const mainText = $('main, article, .content, #content').text() || $('body').text();
  
  // Combine with weights (title and meta tags are more important)
  const weightedText = 
    titleText.repeat(5) + ' ' +
    metaDescription.repeat(3) + ' ' +
    metaKeywords.repeat(3) + ' ' +
    h1Text.repeat(4) + ' ' +
    h2Text.repeat(2) + ' ' +
    mainText;
  
  const text = weightedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Expanded stop words list
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'our', 'your', 'their', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'also', 'any', 'because', 'until', 'while', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'back', 'read', 'need', 'let', 'put', 'mean', 'keep', 'begin', 'show', 'hear', 'play', 'run', 'move', 'like', 'live', 'believe', 'hold', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'home', 'page', 'site', 'website', 'click', 'here', 'more', 'view', 'privacy', 'policy', 'terms', 'conditions', 'copyright', 'rights', 'reserved', 'contact', 'help', 'support', 'login', 'sign', 'register', 'account', 'user', 'menu', 'search', 'skip', 'content', 'main', 'navigation', 'footer', 'header'
  ]);
  
  // Extract words and count frequency
  const words = text.split(' ').filter(word => {
    // Basic length filters
    if (word.length < 3) return false; // minimum 3 characters (allows mot, car, van, etc.)
    if (word.length > 20) return false; // max 20 characters (likely technical)
    if (stopWords.has(word)) return false;
    
    // Filter out pure numbers and technical codes
    if (/^\d+$/.test(word)) return false; // pure numbers
    if (/^[a-z]\d+$/.test(word)) return false; // technical codes like "a1", "x2"
    if (word.includes('_')) return false; // technical variables
    if (/\d{3,}/.test(word)) return false; // contains 3+ consecutive digits
    
    // Must be mostly letters (at least 70%)
    const letterCount = (word.match(/[a-z]/g) || []).length;
    if (letterCount < word.length * 0.7) return false;
    
    return true;
  });
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and get top 25-30 keywords
  const sortedWords = Object.entries(wordCount)
    .filter(([word, count]) => {
      // 3-character words need at least 2 occurrences to be significant
      // 4+ character words need at least 2 occurrences
      if (word.length === 3) {
        return count >= 2; // 3-char words must appear at least twice
      }
      return count >= 2; // all other words must appear at least twice
    })
    .sort((a, b) => b[1] - a[1]) // sort by frequency (most frequent first)
    .slice(0, 30) // get top 30
    .map(([word]) => word);
  
  return sortedWords;
}

// AI functions removed - pure web scraping only

function extractSocialLinks(html: string, baseUrl: string): Record<string, string> {
  console.log(`🔍 extractSocialLinks called for: ${baseUrl}`);
  const $ = cheerio.load(html);
  const socialLinks: Record<string, string> = {};
  
  // Helper function to validate and clean social URLs
  const validateSocialUrl = (url: string, pattern: string): string | null => {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const lowerUrl = cleanUrl.toLowerCase();
    
    if (!lowerUrl.includes(pattern)) return null;
    
    // Exclude share buttons and generic pages
    const excludePatterns = [
      '/sharer/', '/share/', '/intent/', '/shareArticle',  // Share buttons
      '/search', '/login', '/signup', '/privacy', '/terms', '/about/terms', '/about/privacy'  // Generic pages
    ];
    for (const exclude of excludePatterns) {
      if (lowerUrl.includes(exclude)) {
        console.log(`❌ Excluded ${url} (share button or generic page: ${exclude})`);
        return null;
      }
    }
    
    console.log(`✅ Validated: ${cleanUrl}`);
    // Accept any URL that contains the platform domain
    return cleanUrl;
  };
  
  // Method 1: Extract from all <a> tags
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    
    let fullUrl = href;
    // Handle relative URLs
    if (href.startsWith('/') && !href.startsWith('//')) {
      try {
        fullUrl = new URL(href, baseUrl).toString();
      } catch (e) {
        return;
      }
    } else if (href.startsWith('//')) {
      fullUrl = 'https:' + href;
    } else if (!href.startsWith('http')) {
      return; // Skip non-URL hrefs
    }
    
    // Check each platform
    for (const [platform, patterns] of Object.entries(SOCIAL_PLATFORMS)) {
      if (!socialLinks[platform]) {
        for (const pattern of patterns) {
          const validated = validateSocialUrl(fullUrl, pattern);
          if (validated) {
            socialLinks[platform] = validated;
            break;
          }
        }
      }
    }
  });
  
  // Check meta tags
  $('meta').each((_, element) => {
    const content = $(element).attr('content');
    const property = $(element).attr('property') || '';
    const name = $(element).attr('name') || '';
    
    if (content && (property.includes('og:') || name.includes('twitter:'))) {
      const lowerContent = content.toLowerCase();
      
      for (const [platform, patterns] of Object.entries(SOCIAL_PLATFORMS)) {
        if (!socialLinks[platform]) {
          for (const pattern of patterns) {
            if (lowerContent.includes(pattern)) {
              const cleanUrl = content.split('?')[0].split('#')[0];
              
              // Validate it's a proper profile URL
              const urlParts = cleanUrl.split(pattern);
              if (urlParts.length > 1 && urlParts[1].length > 0) {
                const pathAfterDomain = urlParts[1];
                if (pathAfterDomain !== '/' && !pathAfterDomain.startsWith('/search') && !pathAfterDomain.startsWith('/login')) {
                  socialLinks[platform] = cleanUrl;
                  break;
                }
              }
            }
          }
        }
      }
    }
  });
  
  // Method 3: Extract from raw HTML text (for links in JavaScript or plain text)
  const htmlText = html;
  const urlRegex = /https?:\/\/(www\.)?(linkedin\.com\/company\/[^\s"'<>]+|linkedin\.com\/in\/[^\s"'<>]+|facebook\.com\/[^\s"'<>]+|fb\.com\/[^\s"'<>]+|twitter\.com\/[^\s"'<>]+|x\.com\/[^\s"'<>]+|instagram\.com\/[^\s"'<>]+|youtube\.com\/(channel|c|@|user)\/[^\s"'<>]+|youtu\.be\/[^\s"'<>]+|tiktok\.com\/@[^\s"'<>]+|pinterest\.com\/[^\s"'<>]+|github\.com\/[^\s"'<>]+|discord\.gg\/[^\s"'<>]+|discord\.com\/invite\/[^\s"'<>]+)/gi;
  
  const matches = htmlText.match(urlRegex);
  if (matches) {
    for (const match of matches) {
      for (const [platform, patterns] of Object.entries(SOCIAL_PLATFORMS)) {
        if (!socialLinks[platform]) {
          for (const pattern of patterns) {
            const validated = validateSocialUrl(match, pattern);
            if (validated) {
              socialLinks[platform] = validated;
              console.log(`Found ${platform} in raw HTML: ${validated}`);
              break;
            }
          }
        }
      }
    }
  }
  
  return socialLinks;
}

// Search engine fallback to find social profiles and contact pages
async function searchEngineFind(domain: string, searchType: string): Promise<string | null> {
  try {
    const domainClean = domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    
    // Build search query based on type
    let searchQuery = '';
    let expectedDomain = '';
    
    switch (searchType) {
      case 'contact':
        searchQuery = `${domainClean} contact page`;
        expectedDomain = domainClean;
        break;
      case 'facebook':
        searchQuery = `${domainClean} facebook`;
        expectedDomain = 'facebook.com';
        break;
      case 'instagram':
        searchQuery = `${domainClean} instagram`;
        expectedDomain = 'instagram.com';
        break;
      case 'twitter':
        searchQuery = `${domainClean} twitter OR x.com`;
        expectedDomain = 'twitter.com';
        break;
      case 'linkedin':
        searchQuery = `${domainClean} linkedin`;
        expectedDomain = 'linkedin.com';
        break;
      case 'youtube':
        searchQuery = `${domainClean} youtube`;
        expectedDomain = 'youtube.com';
        break;
      default:
        return null;
    }
    
    console.log(`Search fallback: "${searchQuery}"`);
    
    // Try multiple search engines for better results
    const results: string[] = [];
    
    // Method 1: Try Google search (scrape search results page)
    try {
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      const googleResponse = await axios.get(googleUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': USER_AGENTS[0],
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        maxRedirects: 5,
      });
      
      if (googleResponse.data) {
        const $ = cheerio.load(googleResponse.data);
        
        // Extract URLs from Google search results
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            // Google wraps URLs in /url?q= format
            if (href.includes('/url?q=')) {
              const match = href.match(/\/url\?q=([^&]+)/);
              if (match && match[1]) {
                const decodedUrl = decodeURIComponent(match[1]);
                if (decodedUrl.startsWith('http')) {
                  results.push(decodedUrl);
                }
              }
            } else if (href.startsWith('http') && !href.includes('google.com')) {
              results.push(href);
            }
          }
        });
        
        // Also check for direct links in result snippets
        $('.yuRUbf a, .v5yQqb a, cite').each((_, element) => {
          const href = $(element).attr('href') || $(element).text();
          if (href && href.startsWith('http')) {
            results.push(href);
          }
        });
        
        console.log(`Google search found ${results.length} results`);
      }
    } catch (googleError) {
      console.log('Google search failed, trying DuckDuckGo...');
    }
    
    // Method 2: Try DuckDuckGo if Google didn't work well
    if (results.length < 3) {
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
        const ddgResponse = await axios.get(ddgUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': USER_AGENTS[1],
            'Accept': 'text/html',
          },
          maxRedirects: 5,
        });
        
        if (ddgResponse.data) {
          const $ = cheerio.load(ddgResponse.data);
          
          $('.result__url, .result__a, .result__snippet').each((_, element) => {
            const href = $(element).attr('href') || $(element).text();
            if (href && href.startsWith('http')) {
              results.push(href);
            }
          });
          
          console.log(`DuckDuckGo added ${results.length} total results`);
        }
      } catch (ddgError) {
        console.log('DuckDuckGo search also failed');
      }
    }
    
    console.log(`Total search results: ${results.length}`);
    
    // Filter and find the best match
    for (const url of results) {
      const lowerUrl = url.toLowerCase();
      
      if (searchType === 'contact') {
        // For contact pages, look for URLs from the same domain with contact-related paths
        if (lowerUrl.includes(domainClean) && 
            (lowerUrl.includes('contact') || lowerUrl.includes('about') || lowerUrl.includes('reach'))) {
          console.log(`Found contact page via search: ${url}`);
          return url;
        }
      } else {
        // For social profiles, look for the platform domain
        if (lowerUrl.includes(expectedDomain)) {
          // Validate it's a profile URL, not just the homepage
          const cleanUrl = url.split('?')[0].split('#')[0];
          
          if (searchType === 'linkedin' && lowerUrl.includes('linkedin.com/company/')) {
            console.log(`Found LinkedIn via search: ${cleanUrl}`);
            return cleanUrl;
          } else if (searchType === 'facebook' && lowerUrl.includes('facebook.com/') && !lowerUrl.endsWith('facebook.com/')) {
            console.log(`Found Facebook via search: ${cleanUrl}`);
            return cleanUrl;
          } else if ((searchType === 'twitter') && (lowerUrl.includes('twitter.com/') || lowerUrl.includes('x.com/')) && !lowerUrl.match(/\/(twitter\.com|x\.com)\/?$/)) {
            console.log(`Found Twitter/X via search: ${cleanUrl}`);
            return cleanUrl;
          } else if (searchType === 'instagram' && lowerUrl.includes('instagram.com/') && !lowerUrl.endsWith('instagram.com/')) {
            console.log(`Found Instagram via search: ${cleanUrl}`);
            return cleanUrl;
          } else if (searchType === 'youtube' && (lowerUrl.includes('youtube.com/channel/') || lowerUrl.includes('youtube.com/@') || lowerUrl.includes('youtube.com/c/'))) {
            console.log(`Found YouTube via search: ${cleanUrl}`);
            return cleanUrl;
          }
        }
      }
    }
    
    return null;
  } catch (error: any) {
    console.error(`Search engine fallback error for ${searchType}:`, error.message);
    return null;
  }
}

async function searchSocialProfile(companyName: string, platform: string, website: string): Promise<string | null> {
  const cleanName = companyName.replace(/\.(com|io|net|org|co|ai|dev|app|tech)$/i, '').trim();
  const nameVariations = [
    cleanName.toLowerCase().replace(/\s+/g, ''),
    cleanName.toLowerCase().replace(/\s+/g, '-'),
    cleanName.toLowerCase().replace(/\s+/g, '_'),
    cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''),
    cleanName.split(' ')[0].toLowerCase(), // First word only
  ];
  
  // Try direct URL construction with multiple variations
  const patterns: string[] = [];
  
  if (platform === 'linkedin') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://www.linkedin.com/company/${variation}`,
        `https://linkedin.com/company/${variation}`,
      );
    }
  } else if (platform === 'twitter') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://twitter.com/${variation}`,
        `https://x.com/${variation}`,
      );
    }
  } else if (platform === 'facebook') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://www.facebook.com/${variation}`,
        `https://facebook.com/${variation}`,
      );
    }
  } else if (platform === 'instagram') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://www.instagram.com/${variation}`,
        `https://instagram.com/${variation}`,
      );
    }
  } else if (platform === 'youtube') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://www.youtube.com/@${variation}`,
        `https://www.youtube.com/c/${variation}`,
        `https://www.youtube.com/channel/${variation}`,
        `https://www.youtube.com/user/${variation}`,
      );
    }
  } else if (platform === 'tiktok') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://www.tiktok.com/@${variation}`,
        `https://tiktok.com/@${variation}`,
      );
    }
  } else if (platform === 'github') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://github.com/${variation}`,
        `https://www.github.com/${variation}`,
      );
    }
  } else if (platform === 'pinterest') {
    for (const variation of nameVariations) {
      patterns.push(
        `https://www.pinterest.com/${variation}`,
        `https://pinterest.com/${variation}`,
      );
    }
  }
  
  // Try each pattern with retry logic
  for (const pattern of patterns) {
    try {
      const response = await axios.head(pattern, { 
        timeout: 5000,
        maxRedirects: 3,
        validateStatus: (status) => status < 400,
      });
      if (response.status === 200) {
        console.log(`Found ${platform} profile: ${pattern}`);
        return pattern;
      }
    } catch (error: any) {
      // Try GET request if HEAD fails
      if (error.response?.status === 405) {
        try {
          const getResponse = await axios.get(pattern, { 
            timeout: 5000,
            maxRedirects: 3,
            validateStatus: (status) => status < 400,
          });
          if (getResponse.status === 200) {
            console.log(`Found ${platform} profile (via GET): ${pattern}`);
            return pattern;
          }
        } catch {
          continue;
        }
      }
      continue;
    }
  }
  
  return null;
}

function normalizeUrl(url: string): string {
  if (!url) return '';
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

// Multi-step comprehensive extraction
async function comprehensiveExtraction(website: string): Promise<{
  socialLinks: Record<string, string>;
  contactInfo: { email: string; phone: string };
  contactPage: string;
  allPages: string[];
}> {
  const result = {
    socialLinks: {} as Record<string, string>,
    contactInfo: { email: 'Not found', phone: 'Not found' },
    contactPage: 'Not found',
    allPages: [] as string[],
  };

  try {
    // STEP 1: Crawl menu links from homepage
    console.log('Step 1: Crawling menu links from homepage...');
    let homeHtml = await fetchPageContent(website);
    if (!homeHtml) return result;

    let $ = cheerio.load(homeHtml);
    let actualHomepage = website;
    
    // Check if this is a splash/language selection page (very few links, language keywords)
    const navLinks = $('nav a[href], header a[href], .menu a[href], .navigation a[href]').length;
    const bodyText = $('body').text().toLowerCase();
    const isLanguagePage = (bodyText.includes('english') || bodyText.includes('italiano') || 
                           bodyText.includes('français') || bodyText.includes('deutsch') ||
                           bodyText.includes('español')) && navLinks < 5;
    
    if (isLanguagePage) {
      console.log('Detected splash/language page, looking for main content link...');
      // Try to find the English or main content link
      const languageLinks = $('a[href]').toArray();
      for (const link of languageLinks) {
        const href = $(link).attr('href');
        const text = $(link).text().toLowerCase();
        if (href && (text.includes('english') || text.includes('home') || text.includes('enter'))) {
          let contentUrl = href;
          if (href.startsWith('/')) {
            contentUrl = new URL(href, website).toString();
          } else if (!href.startsWith('http')) {
            try {
              contentUrl = new URL(href, website).toString();
            } catch {
              continue;
            }
          }
          console.log(`Following language link to: ${contentUrl}`);
          const contentHtml = await fetchPageContent(contentUrl);
          if (contentHtml) {
            homeHtml = contentHtml;
            $ = cheerio.load(homeHtml);
            actualHomepage = contentUrl;
            break;
          }
        }
      }
    }

    // STEP 1.5: Extract social links from homepage FIRST (including footer)
    console.log('Step 1.5: Extracting social links from homepage...');
    const homepageSocialLinks = extractSocialLinks(homeHtml, actualHomepage);
    for (const [platform, url] of Object.entries(homepageSocialLinks)) {
      if (!result.socialLinks[platform]) {
        result.socialLinks[platform] = url;
        console.log(`Found ${platform} on homepage: ${url}`);
      }
    }
    
    // Also extract contact info from homepage
    const homepageContactInfo = extractEmailAndPhone(homeHtml);
    if (homepageContactInfo.email !== 'Not found') {
      result.contactInfo.email = homepageContactInfo.email;
      console.log(`Found email on homepage: ${homepageContactInfo.email}`);
    }
    if (homepageContactInfo.phone !== 'Not found') {
      result.contactInfo.phone = homepageContactInfo.phone;
      console.log(`Found phone on homepage: ${homepageContactInfo.phone}`);
    }

    const menuLinks: string[] = [];
    const importantKeywords = {
      contact: ['contact', 'contact-us', 'contactus', 'get-in-touch', 'reach-us', 'connect', 'kontakt', 'contato', 'contacto'],
      about: ['about', 'about-us', 'aboutus', 'who-we-are', 'our-story', 'company', 'uber-uns', 'sobre'],
      privacy: ['privacy', 'privacy-policy', 'privacypolicy', 'datenschutz'],
      terms: ['terms', 'terms-conditions', 'terms-of-service', 'tos', 'agb'],
    };

    // Extract ALL links from the page (not just nav/footer)
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const linkText = $(element).text().toLowerCase().trim();
      
      if (href) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = new URL(href, actualHomepage).toString();
        } else if (!href.startsWith('http')) {
          try {
            fullUrl = new URL(href, actualHomepage).toString();
          } catch {
            return;
          }
        }
        
        // Only include links from same domain
        try {
          const linkDomain = new URL(fullUrl).hostname;
          const siteDomain = new URL(website).hostname;
          if (linkDomain === siteDomain && !menuLinks.includes(fullUrl)) {
            menuLinks.push(fullUrl);
            
            // Check link text for contact keywords
            if (importantKeywords.contact.some(kw => linkText.includes(kw)) && result.contactPage === 'Not found') {
              result.contactPage = fullUrl;
              console.log(`Found contact page from link text: ${fullUrl}`);
            }
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });

    // STEP 2: Identify and scrape important pages
    console.log(`Step 2: Found ${menuLinks.length} menu links, identifying important pages...`);
    const pagesToScrape: { url: string; type: string }[] = [
      { url: actualHomepage, type: 'home' },
    ];

    // Categorize links
    for (const link of menuLinks) {
      const lowerLink = link.toLowerCase();
      
      // Check for contact page
      if (importantKeywords.contact.some(kw => lowerLink.includes(kw))) {
        pagesToScrape.push({ url: link, type: 'contact' });
        if (result.contactPage === 'Not found') {
          result.contactPage = link;
        }
      }
      // Check for about page
      else if (importantKeywords.about.some(kw => lowerLink.includes(kw))) {
        pagesToScrape.push({ url: link, type: 'about' });
      }
      // Check for privacy page
      else if (importantKeywords.privacy.some(kw => lowerLink.includes(kw))) {
        pagesToScrape.push({ url: link, type: 'privacy' });
      }
      // Check for terms page
      else if (importantKeywords.terms.some(kw => lowerLink.includes(kw))) {
        pagesToScrape.push({ url: link, type: 'terms' });
      }
    }

    // Limit to max 5 pages to avoid timeout
    const limitedPages = pagesToScrape.slice(0, 5);
    console.log(`Step 3: Scraping ${limitedPages.length} important pages...`);

    // STEP 3: Scrape each important page
    for (const page of limitedPages) {
      try {
        console.log(`Scraping ${page.type} page: ${page.url}`);
        const pageHtml = await fetchPageContent(page.url, 2);
        if (!pageHtml) continue;

        result.allPages.push(page.url);

        // Extract social links
        const pageSocialLinks = extractSocialLinks(pageHtml, page.url);
        for (const [platform, url] of Object.entries(pageSocialLinks)) {
          if (!result.socialLinks[platform]) {
            result.socialLinks[platform] = url;
            console.log(`Found ${platform} on ${page.type} page: ${url}`);
          }
        }

        // Extract contact info
        const pageContactInfo = extractEmailAndPhone(pageHtml);
        if (result.contactInfo.email === 'Not found' && pageContactInfo.email !== 'Not found') {
          result.contactInfo.email = pageContactInfo.email;
          console.log(`Found email on ${page.type} page: ${pageContactInfo.email}`);
        }
        if (result.contactInfo.phone === 'Not found' && pageContactInfo.phone !== 'Not found') {
          result.contactInfo.phone = pageContactInfo.phone;
          console.log(`Found phone on ${page.type} page: ${pageContactInfo.phone}`);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error scraping ${page.type} page:`, error);
      }
    }

    console.log('Comprehensive extraction completed');
    return result;
  } catch (error) {
    console.error('Comprehensive extraction error:', error);
    return result;
  }
}

async function findCompanyWebsite(companyName: string): Promise<string> {
  const cleanName = companyName.trim().toLowerCase();
  const nameVariations = [
    cleanName.replace(/\s+/g, ''),
    cleanName.replace(/\s+/g, '-'),
    cleanName.replace(/\s+/g, '_'),
    cleanName.replace(/[^a-z0-9]/g, ''),
  ];
  
  // Expanded TLD list - most common business domains
  const tlds = [
    'com', 'io', 'net', 'org', 'co', 'ai', 'dev', 'app', 'tech', 'us',
    'co.uk', 'de', 'fr', 'ca', 'au', 'in', 'jp', 'cn', 'br', 'mx'
  ];
  
  // Try common patterns with multiple TLDs
  const patterns: string[] = [];
  for (const variation of nameVariations) {
    for (const tld of tlds) {
      patterns.push(`${variation}.${tld}`);
    }
  }
  
  // Try patterns in batches for better performance
  for (const pattern of patterns) {
    const url = normalizeUrl(pattern);
    try {
      const response = await axios.head(url, { 
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      if (response.status >= 200 && response.status < 300) {
        console.log(`Found website: ${url}`);
        return url;
      }
    } catch (error: any) {
      // Try GET if HEAD fails (some servers block HEAD or have issues)
      try {
        const getResponse = await axios.get(url, { 
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });
        if (getResponse.status >= 200 && getResponse.status < 300) {
          console.log(`Found website (via GET): ${url}`);
          return url;
        }
      } catch {
        continue;
      }
      continue;
    }
  }
  
  return '';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnrichResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      company_name: '',
      website: '',
      company_domain: '',
      contact_page: 'Not found',
      email: 'Not found',
      phone: 'Not found',
      linkedin: 'Not found',
      facebook: 'Not found',
      twitter: 'Not found',
      instagram: 'Not found',
      youtube: 'Not found',
      tiktok: 'Not found',
      pinterest: 'Not found',
    });
  }

  const { 
    company, 
    platforms = [],
    fast_mode = true, // Fast mode is now default for speed
    fields_to_extract = [], // Fields user wants to extract
  } = req.body;

  if (!company) {
    return res.status(400).json({
      company_name: '',
      website: '',
      company_domain: '',
      contact_page: 'Not found',
      email: 'Not found',
      phone: 'Not found',
      linkedin: 'Not found',
      facebook: 'Not found',
      twitter: 'Not found',
      instagram: 'Not found',
      youtube: 'Not found',
      tiktok: 'Not found',
      pinterest: 'Not found',
    });
  }

  // Extract clean company name from domain if input is a URL
  let cleanCompanyName = company;
  const isUrl = company.includes('.') && (company.startsWith('http') || company.startsWith('www') || company.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/));
  
  if (isUrl) {
    try {
      // Normalize URL first
      let urlToProcess = company;
      if (!company.startsWith('http')) {
        urlToProcess = 'https://' + company;
      }
      const urlObj = new URL(urlToProcess);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Extract company name from domain (e.g., "cordial-cables.com" -> "Cordial Cables")
      const domainParts = domain.split('.');
      const mainPart = domainParts[0]; // Get the part before TLD
      
      // Convert hyphens/underscores to spaces and capitalize
      cleanCompanyName = mainPart
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      console.log(`Extracted company name from domain: "${company}" -> "${cleanCompanyName}"`);
    } catch (error) {
      console.log('Could not parse domain, using original input as company name');
    }
  }

  const result: EnrichResult = {
    company_name: cleanCompanyName,
    website: '',
    company_domain: '',
    contact_page: 'Not found',
    email: 'Not found',
    phone: 'Not found',
    linkedin: 'Not found',
    facebook: 'Not found',
    twitter: 'Not found',
    instagram: 'Not found',
    youtube: 'Not found',
    tiktok: 'Not found',
    pinterest: 'Not found',
  };

  try {
    // If input is a URL, extract company name for searching
    let searchName = company;
    const isInputUrl = company.includes('.') && (company.startsWith('http') || company.startsWith('www') || company.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/));
    
    if (isInputUrl) {
      try {
        let urlToProcess = company;
        if (!company.startsWith('http')) {
          urlToProcess = 'https://' + company;
        }
        const urlObj = new URL(urlToProcess);
        const domain = urlObj.hostname.replace('www.', '');
        const domainParts = domain.split('.');
        const mainPart = domainParts[0];
        
        // Use clean name for searching (e.g., "gitarrenrichter" instead of "gitarrenrichter.de")
        searchName = mainPart
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        console.log(`Input is URL, using "${searchName}" for social profile searches`);
      } catch (error) {
        console.log('Could not parse URL, using original input');
      }
    }
    
    // Pure web scraping - no AI methods
    
    // STEP 1: DIRECT SEARCH - Try direct profile URLs first (FASTEST METHOD)
    console.log('🚀 STEP 1: Trying direct profile URLs...');
    const allPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'pinterest'];
    
    // Only search for platforms user wants to extract
    const directSearchPlatforms = fields_to_extract.length > 0 
      ? allPlatforms.filter(p => fields_to_extract.includes(p))
      : allPlatforms;
    
    console.log(`Extracting ${directSearchPlatforms.length} platforms: ${directSearchPlatforms.join(', ')}`);
    let directSearchSuccessCount = 0;
    
    for (const platform of directSearchPlatforms) {
      const foundUrl = await searchSocialProfile(searchName, platform, '');
      if (foundUrl) {
        result[platform as keyof EnrichResult] = foundUrl as any;
        directSearchSuccessCount++;
        console.log(`✅ STEP 1: Found ${platform} via direct search: ${foundUrl}`);
      }
    }
    
    console.log(`✅ STEP 1 Complete: Found ${directSearchSuccessCount}/${directSearchPlatforms.length} profiles via direct search`);
    
    // STEP 2: WEBSITE DISCOVERY - Find company website
    console.log('🌐 STEP 2: Finding company website...');
    const isUrl = /\.(com|io|net|org|co|ai|dev|app|tech)\b/i.test(company);
    
    let website: string;
    if (isUrl) {
      website = normalizeUrl(company);
    } else {
      website = await findCompanyWebsite(company);
    }

    if (!website) {
      // If we found some profiles via direct search, still return success
      if (directSearchSuccessCount > 0) {
        console.log('⚠️ Website not found, but returning direct search results');
        return res.status(200).json(result);
      }
      return res.status(200).json(result);
    }

    result.website = website;
    
    // Extract domain from website
    try {
      const urlObj = new URL(website);
      result.company_domain = urlObj.hostname.replace('www.', '');
    } catch {
      result.company_domain = '';
    }
    console.log(`✅ STEP 2 Complete: Website found: ${website}`);

    // FAST MODE: Skip heavy extraction for bulk processing
    if (fast_mode) {
      console.log('⚡ FAST MODE: Quick extraction from homepage only');
      
      const homeHtml = await fetchPageContent(website);
      if (homeHtml) {
        // Extract actual company name from website content
        const extractedName = extractCompanyName(homeHtml, result.company_domain);
        if (extractedName && extractedName !== cleanCompanyName) {
          result.company_name = extractedName;
          console.log(`📝 Extracted company name from website: "${extractedName}"`);
        }
        
        // Quick contact page detection from homepage links (only if requested)
        if (fields_to_extract.length === 0 || fields_to_extract.includes('contact_page')) {
          const $ = cheerio.load(homeHtml);
          const contactKeywords = ['contact', 'contact-us', 'contactus', 'get-in-touch', 'reach-us', 'connect'];
          
          $('a[href]').each((_, element) => {
            if (result.contact_page !== 'Not found') return;
            
            const href = $(element).attr('href');
            const linkText = $(element).text().toLowerCase().trim();
            
            if (href && contactKeywords.some(kw => linkText.includes(kw) || href.toLowerCase().includes(kw))) {
              let contactUrl = href;
              if (href.startsWith('/')) {
                contactUrl = new URL(href, website).toString();
              } else if (!href.startsWith('http')) {
                try {
                  contactUrl = new URL(href, website).toString();
                } catch {
                  return;
                }
              }
              
              // Verify it's same domain
              try {
                const linkDomain = new URL(contactUrl).hostname;
                const siteDomain = new URL(website).hostname;
                if (linkDomain === siteDomain) {
                  result.contact_page = contactUrl;
                  console.log(`⚡ FAST MODE: Found contact page: ${contactUrl}`);
                }
              } catch {
                // Invalid URL, skip
              }
            }
          });
        }
        
        // Quick email/phone extraction from homepage (only if requested)
        if (fields_to_extract.length === 0 || fields_to_extract.includes('email') || fields_to_extract.includes('phone')) {
          const contactInfo = extractEmailAndPhone(homeHtml);
          if ((fields_to_extract.length === 0 || fields_to_extract.includes('email')) && contactInfo.email !== 'Not found') {
            result.email = contactInfo.email;
            console.log(`⚡ FAST MODE: Found email: ${contactInfo.email}`);
          }
          if ((fields_to_extract.length === 0 || fields_to_extract.includes('phone')) && contactInfo.phone !== 'Not found') {
            result.phone = contactInfo.phone;
            console.log(`⚡ FAST MODE: Found phone: ${contactInfo.phone}`);
          }
        }
      }
      
      return res.status(200).json(result);
    }

    // STEP 3: COMPREHENSIVE EXTRACTION - Crawl website for missing data
    console.log('🔍 STEP 3: Starting comprehensive website extraction...');
    const extracted = await comprehensiveExtraction(website);
    
    // Apply extracted data to result (only if not already found in Step 1)
    if (extracted.contactPage !== 'Not found') {
      result.contact_page = extracted.contactPage;
    }
    
    if (extracted.contactInfo.email !== 'Not found') {
      result.email = extracted.contactInfo.email;
    }
    
    if (extracted.contactInfo.phone !== 'Not found') {
      result.phone = extracted.contactInfo.phone;
    }
    
    // Apply social links from comprehensive extraction (merge with Step 1 results)
    console.log('📊 Merging extracted social links with direct search results...');
    
    for (const [platform, url] of Object.entries(extracted.socialLinks)) {
      // Only use extracted link if we didn't find it in Step 1 (direct search)
      if (url && url !== 'Not found' && result[platform as keyof EnrichResult] === 'Not found') {
        result[platform as keyof EnrichResult] = url as any;
        console.log(`✅ STEP 3: Found ${platform} via website extraction: ${url}`);
      }
    }
    
    // Keywords extraction removed - not needed
    
    console.log('✅ STEP 3 Complete: Website extraction finished');
    
    // STEP 4: SEARCH ENGINE FALLBACK - Find any remaining missing data
    console.log('🔍 STEP 4: Using search engine fallback for missing data...');
    
    // Try to find contact page if still missing
    if (result.contact_page === 'Not found') {
      const contactUrl = await searchEngineFind(website, 'contact');
      if (contactUrl) {
        result.contact_page = contactUrl;
        console.log(`✅ STEP 4: Found contact page via search engine: ${contactUrl}`);
      }
    }
    
    // Try to find social profiles via search engine
    const socialPlatforms = ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube'];
    for (const platform of socialPlatforms) {
      if (result[platform as keyof EnrichResult] === 'Not found') {
        const foundUrl = await searchEngineFind(website, platform);
        if (foundUrl) {
          result[platform as keyof EnrichResult] = foundUrl as any;
          console.log(`✅ STEP 4: Found ${platform} via search engine: ${foundUrl}`);
        }
      }
    }
    
    console.log('✅ STEP 4 Complete: Search engine fallback finished');

    // Processing complete
    
    console.log('🎯 FINAL RESULT BEING RETURNED:', JSON.stringify({
      company: result.company_name,
      linkedin: result.linkedin,
      facebook: result.facebook,
      twitter: result.twitter,
      instagram: result.instagram,
      youtube: result.youtube,
      tiktok: result.tiktok,
      pinterest: result.pinterest
    }));
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error during enrichment:', error);
    return res.status(200).json(result);
  }
}
