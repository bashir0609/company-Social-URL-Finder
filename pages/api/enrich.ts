import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SOCIAL_PLATFORMS = {
  linkedin: ['linkedin.com/company/', 'linkedin.com/in/', 'linkedin.com/school/'],
  facebook: ['facebook.com/', 'fb.com/'],
  twitter: ['twitter.com/', 'x.com/'],
  instagram: ['instagram.com/'],
  youtube: ['youtube.com/channel/', 'youtube.com/c/', 'youtube.com/@', 'youtube.com/user/'],
  tiktok: ['tiktok.com/@'],
  pinterest: ['pinterest.com/'],
  github: ['github.com/'],
};

interface EnrichResult {
  company_name: string;
  website: string;
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
  github: string;
  status: string;
}

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function extractEmailAndPhone(html: string): { email: string; phone: string } {
  const $ = cheerio.load(html);
  const result = { email: 'Not found', phone: 'Not found' };
  
  // Extract email
  // Look for mailto links
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && result.email === 'Not found') {
      const email = href.replace('mailto:', '').split('?')[0].trim();
      // Validate email format
      if (email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        result.email = email;
      }
    }
  });
  
  // If no mailto found, search in text content
  if (result.email === 'Not found') {
    const text = $('body').text();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      // Filter out common non-contact emails
      const validEmails = emails.filter(email => 
        !email.includes('example.com') && 
        !email.includes('test.com') &&
        !email.includes('sentry.io') &&
        !email.includes('wixpress.com')
      );
      if (validEmails.length > 0) {
        result.email = validEmails[0];
      }
    }
  }
  
  // Extract phone number
  // Look for tel links
  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && result.phone === 'Not found') {
      const phone = href.replace('tel:', '').trim();
      result.phone = phone;
    }
  });
  
  // If no tel link found, search in text content
  if (result.phone === 'Not found') {
    const text = $('body').text();
    // Match various phone formats
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      // Get the first valid-looking phone number
      result.phone = phones[0].trim();
    }
  }
  
  return result;
}

function extractSocialLinks(html: string, baseUrl: string): Record<string, string> {
  const $ = cheerio.load(html);
  const socialLinks: Record<string, string> = {};
  
  // Find all links
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    
    let fullUrl = href;
    if (href.startsWith('/')) {
      fullUrl = new URL(href, baseUrl).toString();
    }
    
    const lowerUrl = fullUrl.toLowerCase();
    
    // Check each platform with proper validation
    for (const [platform, patterns] of Object.entries(SOCIAL_PLATFORMS)) {
      if (!socialLinks[platform]) {
        for (const pattern of patterns) {
          if (lowerUrl.includes(pattern)) {
            // Validate it's actually a profile URL, not just contains the domain
            const cleanUrl = fullUrl.split('?')[0].split('#')[0];
            
            // Additional validation: check if URL has content after the platform domain
            const urlParts = cleanUrl.split(pattern);
            if (urlParts.length > 1 && urlParts[1].length > 0) {
              // Make sure it's not just the domain or a generic page
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
  
  return socialLinks;
}

async function searchSocialProfile(companyName: string, platform: string, website: string): Promise<string | null> {
  const cleanName = companyName.replace(/\.(com|io|net|org)$/i, '').trim();
  
  // Try direct URL construction
  const patterns: string[] = [];
  
  if (platform === 'linkedin') {
    patterns.push(
      `https://www.linkedin.com/company/${cleanName.toLowerCase().replace(/\s+/g, '-')}`,
      `https://www.linkedin.com/company/${cleanName.toLowerCase().replace(/\s+/g, '')}`
    );
  } else if (platform === 'twitter') {
    patterns.push(
      `https://twitter.com/${cleanName.toLowerCase().replace(/\s+/g, '')}`,
      `https://x.com/${cleanName.toLowerCase().replace(/\s+/g, '')}`
    );
  } else if (platform === 'facebook') {
    patterns.push(
      `https://www.facebook.com/${cleanName.toLowerCase().replace(/\s+/g, '')}`,
      `https://www.facebook.com/${cleanName.toLowerCase().replace(/\s+/g, '-')}`
    );
  } else if (platform === 'instagram') {
    patterns.push(
      `https://www.instagram.com/${cleanName.toLowerCase().replace(/\s+/g, '')}`,
      `https://www.instagram.com/${cleanName.toLowerCase().replace(/\s+/g, '_')}`
    );
  } else if (platform === 'youtube') {
    patterns.push(
      `https://www.youtube.com/@${cleanName.toLowerCase().replace(/\s+/g, '')}`,
      `https://www.youtube.com/c/${cleanName.toLowerCase().replace(/\s+/g, '')}`
    );
  }
  
  // Try each pattern
  for (const pattern of patterns) {
    try {
      const response = await axios.head(pattern, { timeout: 3000 });
      if (response.status === 200) {
        return pattern;
      }
    } catch {
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

async function findCompanyWebsite(companyName: string): Promise<string> {
  const cleanName = companyName.trim().toLowerCase();
  
  // Try common patterns
  const patterns = [
    `${cleanName.replace(/\s+/g, '')}.com`,
    `${cleanName.replace(/\s+/g, '-')}.com`,
    `${cleanName.replace(/\s+/g, '')}.io`,
    `${cleanName.replace(/\s+/g, '')}.net`,
  ];
  
  for (const pattern of patterns) {
    try {
      const url = normalizeUrl(pattern);
      const response = await axios.head(url, { timeout: 5000 });
      if (response.status === 200) {
        return url;
      }
    } catch {
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
      github: 'Not found',
      status: 'Method not allowed',
    });
  }

  const { company, method = 'extraction', apiKey, customPrompt } = req.body;

  // Use API key from request body or environment variable
  const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;

  // Validate AI method requirements
  if (method === 'ai' && !effectiveApiKey) {
    return res.status(400).json({
      company_name: company || '',
      website: '',
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
      github: 'Not found',
      status: 'AI method requires API key',
    });
  }

  if (!company) {
    return res.status(400).json({
      company_name: '',
      website: '',
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
      github: 'Not found',
      status: 'Company name required',
    });
  }

  const result: EnrichResult = {
    company_name: company,
    website: '',
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
    github: 'Not found',
    status: 'Processing',
  };

  try {
    // Determine if input is URL or company name
    const isUrl = /\.(com|io|net|org|co|ai|dev|app|tech)\b/i.test(company);
    
    let website: string;
    if (isUrl) {
      website = normalizeUrl(company);
    } else {
      website = await findCompanyWebsite(company);
    }

    if (!website) {
      result.status = 'Failed: Could not find website';
      return res.status(200).json(result);
    }

    result.website = website;

    // Fetch website content
    const html = await fetchPageContent(website);
    
    if (!html) {
      result.status = 'Failed: Could not fetch website';
      return res.status(200).json(result);
    }

    // Extract email and phone
    const contactInfo = extractEmailAndPhone(html);
    result.email = contactInfo.email;
    result.phone = contactInfo.phone;

    // Extract social links
    const socialLinks = extractSocialLinks(html, website);
    
    // Update result with found links
    for (const [platform, url] of Object.entries(socialLinks)) {
      if (platform in result) {
        result[platform as keyof EnrichResult] = url;
      }
    }

    // Search for missing platforms
    const missingPlatforms = ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube'];
    for (const platform of missingPlatforms) {
      if (result[platform as keyof EnrichResult] === 'Not found') {
        const foundUrl = await searchSocialProfile(company, platform, website);
        if (foundUrl) {
          result[platform as keyof EnrichResult] = foundUrl;
        }
      }
    }

    // Find contact page
    const $ = cheerio.load(html);
    const contactKeywords = ['contact', 'contact-us', 'contactus', 'get-in-touch', 'reach-us'];
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      const lowerHref = href.toLowerCase();
      for (const keyword of contactKeywords) {
        if (lowerHref.includes(keyword)) {
          let contactUrl = href;
          if (href.startsWith('/')) {
            contactUrl = new URL(href, website).toString();
          }
          result.contact_page = contactUrl;
          return false; // break
        }
      }
    });

    result.status = 'Success';
    return res.status(200).json(result);

  } catch (error) {
    result.status = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return res.status(200).json(result);
  }
}
