// Crawlee-based scraper - Production-ready web scraping
import { PlaywrightCrawler } from 'crawlee';

interface CrawleeScrapedData {
  html: string;
  socialLinks: Record<string, string>;
  email: string;
  phone: string;
  success: boolean;
  finalUrl: string;
}

/**
 * Scrape website using Crawlee (production-ready)
 */
export async function scrapeWithCrawlee(url: string): Promise<CrawleeScrapedData> {
  // Use a Promise to capture the result from inside the crawler
  return new Promise((resolve) => {
    let result: CrawleeScrapedData = {
      html: '',
      socialLinks: {},
      email: 'Not found',
      phone: 'Not found',
      success: false,
      finalUrl: url,
    };

    const crawler = new PlaywrightCrawler({
      // Crawler configuration
      maxRequestRetries: 3,
      requestHandlerTimeoutSecs: 60,
      navigationTimeoutSecs: 60,
      
      // Memory optimization
      maxConcurrency: 1, // Only 1 page at a time
      autoscaledPoolOptions: {
        maxConcurrency: 1,
        desiredConcurrency: 1,
      },
      
      // Browser configuration
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu', // Reduce GPU memory usage
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--window-size=1024,768', // Smaller viewport = less memory
          ],
        },
      },

      async requestHandler({ page, request, log }) {
        try {
          log.info(`Scraping ${request.url}`);

          // Wait for page to load
          await page.waitForLoadState('domcontentloaded');
          
          // Wait for footer (most sites have it)
          await page.waitForSelector('footer, .footer, #footer', { timeout: 5000 }).catch(() => {
            log.info('No footer found, continuing...');
          });
          
          // Wait for JavaScript to execute
          await page.waitForTimeout(3000);

          // Get final URL after redirects
          const finalUrl = page.url();
          if (finalUrl !== request.url) {
            log.info(`Redirected to: ${finalUrl}`);
          }

          // Extract social links directly from page
          const socialLinks = await page.evaluate(() => {
            const result: Record<string, string> = {};
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            
            for (const link of allLinks) {
              const href = link.getAttribute('href') || '';
              const fullHref = href.startsWith('http') 
                ? href 
                : new URL(href, window.location.href).toString();
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

          // Extract email and phone
          const contactInfo = await page.evaluate(() => {
            let email = 'Not found';
            let phone = 'Not found';
            
            // Extract email from mailto links
            const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
            if (mailtoLinks.length > 0) {
              const href = mailtoLinks[0].getAttribute('href');
              if (href) {
                email = href.replace('mailto:', '').split('?')[0].trim();
              }
            }
            
            // Extract phone from tel links
            const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
            if (telLinks.length > 0) {
              const href = telLinks[0].getAttribute('href');
              if (href) {
                phone = href.replace('tel:', '').trim();
              }
            }
            
            return { email, phone };
          });

          // Get HTML content
          const html = await page.content();

          // Update result
          result = {
            html,
            socialLinks,
            email: contactInfo.email,
            phone: contactInfo.phone,
            success: true,
            finalUrl,
          };

          log.info(`Successfully scraped ${finalUrl}`);
          log.info(`Found ${Object.keys(socialLinks).length} social links`);

        } catch (error: any) {
          log.error(`Error scraping ${request.url}: ${error.message}`);
          result.success = false;
        }
      },

      // Error handling
      failedRequestHandler({ request, log }, error) {
        log.error(`Request ${request.url} failed after retries: ${error.message}`);
        result.success = false;
      },
    });

    // Run the crawler and resolve when done
    crawler.run([url]).then(() => {
      resolve(result);
    }).catch((error) => {
      console.error('Crawlee run error:', error);
      resolve(result);
    });
  });
}

/**
 * Lightweight version - just get social links quickly
 */
export async function quickScrapeWithCrawlee(url: string): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    let socialLinks: Record<string, string> = {};

    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 2,
      requestHandlerTimeoutSecs: 30,
      maxConcurrency: 1,
      
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1024,768',
          ],
        },
      },

      async requestHandler({ page }) {
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        socialLinks = await page.evaluate(() => {
          const result: Record<string, string> = {};
          const allLinks = Array.from(document.querySelectorAll('a[href]'));
          
          for (const link of allLinks) {
            const href = link.getAttribute('href') || '';
            const fullHref = href.startsWith('http') 
              ? href 
              : new URL(href, window.location.href).toString();
            const lowerHref = fullHref.toLowerCase();
            
            if (!result.linkedin && lowerHref.includes('linkedin.com/company/')) {
              result.linkedin = fullHref.split('?')[0];
            } else if (!result.facebook && lowerHref.includes('facebook.com/')) {
              result.facebook = fullHref.split('?')[0];
            } else if (!result.twitter && (lowerHref.includes('twitter.com/') || lowerHref.includes('x.com/'))) {
              result.twitter = fullHref.split('?')[0];
            } else if (!result.instagram && lowerHref.includes('instagram.com/')) {
              result.instagram = fullHref.split('?')[0];
            } else if (!result.youtube && lowerHref.includes('youtube.com/')) {
              result.youtube = fullHref.split('?')[0];
            }
          }
          
          return result;
        });
      },
    });

    crawler.run([url]).then(() => {
      resolve(socialLinks);
    }).catch((error) => {
      console.error('Crawlee quick scrape error:', error);
      resolve(socialLinks);
    });
  });
}
