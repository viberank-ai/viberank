/**
 * ChatGPT Scraper Module - Automated ChatGPT search with browsing capabilities
 *
 * This module automates ChatGPT's browsing feature to perform web-enabled searches
 * and extract both the AI's response and any citations it used. This is critical
 * for brand monitoring since ChatGPT's browsing mode can access current web content
 * and cite sources, making it representative of how users experience AI search.
 *
 * Key features:
 * - Authenticated session handling via cookies
 * - Automatic query submission and response waiting
 * - Citation extraction from generated responses
 * - Stealth mode to avoid detection
 *
 * Used by:
 * - packages/pipeline/src/runScan.ts: As one of the AI search engines to monitor
 * - Snapshot generation for brand visibility analysis
 * - Golden sample collection in packages/eval
 *
 * Requirements:
 * - CHATGPT_COOKIE environment variable with valid session token
 * - ChatGPT Plus/Pro subscription for browsing capabilities
 */

import { chromium } from 'playwright-extra';
import type { Page } from 'playwright-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Enable stealth plugin to avoid ChatGPT's bot detection
// This is particularly important since ChatGPT actively blocks automated access
chromium.use(StealthPlugin());

/**
 * ChatGPTResult - Structured output from ChatGPT search
 *
 * Represents both the AI's response text and any web sources it cited.
 * This data structure is converted to Snapshot format for analysis.
 */
export interface ChatGPTResult {
  /** Full text response from ChatGPT (converted to HTML later) */
  answer: string;

  /** Array of unique URLs that ChatGPT cited in its response
   * Used to determine if brand websites were used as sources */
  citations: string[];
}

/**
 * chatGPTBrowse - Performs automated ChatGPT search with browsing enabled
 *
 * This function automates the complete ChatGPT browsing workflow:
 * 1. Launches browser with authentication cookies
 * 2. Navigates to ChatGPT with browsing model enabled
 * 3. Submits the search query
 * 4. Waits for AI response generation (up to 45 seconds)
 * 5. Extracts both response text and citation links
 * 6. Returns structured data for brand analysis
 *
 * The function specifically uses the browsing-enabled model to ensure
 * ChatGPT can access current web content, making results more representative
 * of real user searches.
 *
 * @param query - Search query to submit to ChatGPT (e.g., "best CRM software 2024")
 * @returns ChatGPTResult with response text and cited URLs
 * @throws Error if authentication fails or response times out
 *
 * Authentication requirements:
 * - CHATGPT_COOKIE must contain valid __Secure-next-auth.session-token
 * - Session must have access to ChatGPT browsing (Plus/Pro subscription)
 * - Cookie must be refreshed periodically as sessions expire
 *
 * Used by:
 * - pipeline/src/runScan.ts: scrapeOne() function for ChatGPT surface
 * - Manual testing scripts for ChatGPT response analysis
 */
export async function chatGPTBrowse(query: string): Promise<ChatGPTResult> {
  // Launch browser instance for this search
  const browser = await chromium.launch({ headless: true });

  // Create browser context with appropriate locale and headers
  const context = await browser.newContext({
    locale: 'en-US',
    extraHTTPHeaders: { 'User-Agent': 'Mozilla/5.0' },
  });

  // Add authentication cookie to access ChatGPT
  // This cookie provides authenticated access to ChatGPT's interface
  // Must be obtained from a logged-in ChatGPT session
  await context.addCookies([
    {
      name: '__Secure-next-auth.session-token',
      value: process.env.CHATGPT_COOKIE || '',
      domain: '.chat.openai.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  // Create page and navigate to ChatGPT with browsing model
  // The gpt-4o-browsing model parameter ensures web access is enabled
  const page: Page = await context.newPage();
  await page.goto('https://chat.openai.com/?model=gpt-4o-browsing', {
    waitUntil: 'domcontentloaded',
  });

  // Submit query to ChatGPT
  // Fill the textarea and press Enter to submit
  await page.fill('textarea', query);
  await page.keyboard.press('Enter');

  // Wait for response generation
  // ChatGPT responses with browsing can take 30-45 seconds to generate
  // The div.markdown selector indicates the response is ready
  await page.waitForSelector('div.markdown', { timeout: 45_000 });

  // Extract response text from the markdown container
  // This contains the full AI-generated response
  const answer = await page.$eval('div.markdown', (el) => el.textContent || '');

  // Extract all citation links from the response
  // Find all links that start with http (external citations)
  // Filter for uniqueness since ChatGPT may cite the same source multiple times
  const citations = await page.$$eval('a[href^="http"]', (els) =>
    els.map((e) => (e as HTMLAnchorElement).href).filter((v, i, a) => a.indexOf(v) === i)
  );

  // Clean up browser resources
  await browser.close();

  return { answer, citations };
}
