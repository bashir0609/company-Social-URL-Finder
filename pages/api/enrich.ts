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
  keywords?: string[];
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
    const targetAreas = $('footer, .contact, .footer, #contact, #footer, [class*="contact"], [class*="footer"], [class*="phone"]').text();
    // Improved phone regex to match more formats
    const phoneRegex = /(\+?\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g;
    let phones = targetAreas.match(phoneRegex);
    
    // If not found in targeted areas, search entire body
    if (!phones || phones.length === 0) {
      const bodyText = $('body').text();
      phones = bodyText.match(phoneRegex);
    }
    
    if (phones && phones.length > 0) {
      // Filter to get valid phone numbers (at least 10 digits)
      const validPhones = phones.filter((phone: string) => {
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
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
  $('script, style, nav, header, footer').remove();
  
  // Get text content
  const text = $('body').text()
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Common stop words to filter out
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'our', 'your', 'their']);
  
  // Extract words and count frequency
  const words = text.split(' ').filter(word => 
    word.length > 3 && 
    !stopWords.has(word) &&
    !/^\d+$/.test(word) // exclude pure numbers
  );
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and get top 15-20
  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
  
  return sortedWords;
}

async function geminiAISearch(
  company: string,
  apiKey: string,
  customPrompt?: string
): Promise<Partial<EnrichResult>> {
  const defaultPrompt = `Find all official social media profiles for the company "${company}". 
Return ONLY the direct URLs in this exact JSON format:
{
  "website": "company website URL",
  "linkedin": "LinkedIn company page URL",
  "facebook": "Facebook page URL", 
  "twitter": "Twitter/X profile URL",
  "instagram": "Instagram profile URL",
  "youtube": "YouTube channel URL",
  "tiktok": "TikTok profile URL",
  "email": "contact email",
  "phone": "contact phone"
}
If you cannot find a specific profile, use "Not found" as the value.
Return ONLY valid JSON, no additional text.`;

  const prompt = customPrompt || defaultPrompt;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt.replace('[company name]', company)
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const aiResponse = response.data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    // Try to extract JSON from the response
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('No JSON found in Gemini response:', aiResponse);
      return {};
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the URLs
    const cleanedData: Partial<EnrichResult> = {};
    const urlFields = ['website', 'linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'contact_page'];
    
    for (const field of urlFields) {
      if (parsedData[field] && parsedData[field] !== 'Not found' && parsedData[field].startsWith('http')) {
        cleanedData[field as keyof EnrichResult] = parsedData[field];
      }
    }
    
    // Add email and phone if found
    if (parsedData.email && parsedData.email !== 'Not found') {
      cleanedData.email = parsedData.email;
    }
    if (parsedData.phone && parsedData.phone !== 'Not found') {
      cleanedData.phone = parsedData.phone;
    }

    return cleanedData;
  } catch (error: any) {
    console.error('Gemini AI search error:', error.response?.data || error.message);
    return {};
  }
}

async function aiSearchSocialProfiles(
  company: string, 
  apiKey: string, 
  model: string = 'openai/gpt-3.5-turbo',
  customPrompt?: string
): Promise<Partial<EnrichResult>> {
  const defaultPrompt = `Find all official social media profiles for the company "${company}". 
Return ONLY the direct URLs in this exact JSON format:
{
  "website": "company website URL",
  "linkedin": "LinkedIn company page URL",
  "facebook": "Facebook page URL", 
  "twitter": "Twitter/X profile URL",
  "instagram": "Instagram profile URL",
  "youtube": "YouTube channel URL",
  "tiktok": "TikTok profile URL",
  "email": "contact email",
  "phone": "contact phone"
}
If you cannot find a specific profile, use "Not found" as the value.
Return ONLY valid JSON, no additional text.`;

  const prompt = customPrompt || defaultPrompt;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt.replace('[company name]', company)
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'Company Social Finder',
        },
        timeout: 30000,
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || '{}';
    
    // Try to extract JSON from the response
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('No JSON found in AI response:', aiResponse);
      return {};
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the URLs
    const cleanedData: Partial<EnrichResult> = {};
    const urlFields = ['website', 'linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'contact_page'];
    
    for (const field of urlFields) {
      if (parsedData[field] && parsedData[field] !== 'Not found' && parsedData[field].startsWith('http')) {
        cleanedData[field as keyof EnrichResult] = parsedData[field];
      }
    }
    
    // Add email and phone if found
    if (parsedData.email && parsedData.email !== 'Not found') {
      cleanedData.email = parsedData.email;
    }
    if (parsedData.phone && parsedData.phone !== 'Not found') {
      cleanedData.phone = parsedData.phone;
    }

    return cleanedData;
  } catch (error: any) {
    console.error('AI search error:', error.response?.data || error.message);
    return {};
  }
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

  const { company, method = 'extraction', apiKey, geminiApiKey, customPrompt, model, aiProvider = 'openrouter' } = req.body;

  // Use API key from request body or environment variable
  const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;
  const effectiveGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

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
    // AI METHOD: Use AI provider (OpenRouter or Gemini) for intelligent search
    if (method === 'ai') {
      let aiResults: Partial<EnrichResult> = {};
      
      if (aiProvider === 'gemini' && effectiveGeminiKey) {
        console.log('Using Gemini AI');
        aiResults = await geminiAISearch(company, effectiveGeminiKey, customPrompt);
      } else if (aiProvider === 'openrouter' && effectiveApiKey) {
        console.log(`Using OpenRouter AI with model: ${model || 'default'}`);
        aiResults = await aiSearchSocialProfiles(company, effectiveApiKey, model, customPrompt);
      }
      
      // Merge AI results into result object
      for (const [key, value] of Object.entries(aiResults)) {
        if (value && value !== 'Not found') {
          // Skip keywords field as it's handled separately
          if (key !== 'keywords') {
            result[key as keyof EnrichResult] = value as any;
          }
        }
      }
      
      // If AI found website, use it
      if (aiResults.website) {
        result.website = aiResults.website;
      }
      
      // Check if AI found contact info
      const hasContactInfo = result.email !== 'Not found' && 
                            result.phone !== 'Not found' &&
                            result.contact_page !== 'Not found';
      
      // Check if AI found social links
      const hasSocialLinks = result.linkedin !== 'Not found' && 
                            result.facebook !== 'Not found' && 
                            result.twitter !== 'Not found';
      
      // If AI found everything, return immediately
      if (hasContactInfo && hasSocialLinks) {
        result.status = 'Success (AI-powered)';
        return res.status(200).json(result);
      }
      
      // Otherwise, fall back to extraction for missing fields
      console.log('AI search incomplete, falling back to extraction for missing fields');
    }
    
    // EXTRACTION METHOD: Traditional web scraping
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

    // Load HTML once for all extractions
    const $ = cheerio.load(html);

    // Extract contact page first
    if (result.contact_page === 'Not found') {
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
            } else if (!href.startsWith('http')) {
              contactUrl = new URL(href, website).toString();
            }
            result.contact_page = contactUrl;
            return false; // break
          }
        }
      });
    }

    // Extract email and phone (only if not already found by AI)
    if (result.email === 'Not found' || result.phone === 'Not found') {
      const contactInfo = extractEmailAndPhone(html);
      if (result.email === 'Not found') result.email = contactInfo.email;
      if (result.phone === 'Not found') result.phone = contactInfo.phone;
      console.log(`Extracted contact info for ${company}: email=${contactInfo.email}, phone=${contactInfo.phone}`);
    }

    // Extract social links (only for platforms not found by AI)
    const socialLinks = extractSocialLinks(html, website);
    
    // Update result with found links (don't overwrite AI results)
    for (const [platform, url] of Object.entries(socialLinks)) {
      if (platform in result && platform !== 'keywords' && result[platform as keyof EnrichResult] === 'Not found') {
        result[platform as keyof EnrichResult] = url as any;
      }
    }

    // Search for missing platforms
    const missingPlatforms = ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube'];
    for (const platform of missingPlatforms) {
      if (result[platform as keyof EnrichResult] === 'Not found') {
        const foundUrl = await searchSocialProfile(company, platform, website);
        if (foundUrl) {
          result[platform as keyof EnrichResult] = foundUrl as any;
        }
      }
    }

    // Extract keywords from website
    result.keywords = extractKeywords(html);

    result.status = 'Success';
    return res.status(200).json(result);

  } catch (error) {
    result.status = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return res.status(200).json(result);
  }
}
