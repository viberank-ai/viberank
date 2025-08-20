/**
 * Browser Automation Module - Playwright-based web scraping with stealth capabilities
 *
 * This module provides a robust browser automation system for scraping AI search engines
 * while avoiding detection. It uses Playwright with stealth plugins and proxy rotation
 * to bypass anti-bot measures commonly employed by search platforms.
 *
 * Key features:
 * - Stealth mode to avoid bot detection
 * - Proxy rotation for IP distribution
 * - Realistic user agent strings
 * - Configurable timeouts for reliability
 *
 * Used by:
 * - packages/scraper/src/chatgpt.ts: Browser automation for ChatGPT
 * - packages/scraper/src/googleAI.ts: Browser automation for Google AI
 * - Future scrapers for Perplexity and other AI platforms
 *
 * The openPage function is the primary interface that other scrapers use
 * to fetch HTML content from target URLs with proper stealth measures.
 */

import { chromium } from 'playwright-extra';
import type { Page } from 'playwright-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Enable stealth plugin to avoid detection by anti-bot systems
// This modifies browser fingerprints and behaviors to appear more human-like
chromium.use(StealthPlugin());

// Parse proxy pool from environment variable for IP rotation
// Format: "proxy1:port,proxy2:port,proxy3:port"
// Used to distribute requests across multiple IP addresses
const proxies = (process.env.PROXY_POOL || '').split(',').filter(Boolean);
let proxyIdx = 0;

/**
 * nextProxy - Rotates through available proxy servers
 *
 * Implements round-robin proxy selection to distribute traffic and avoid
 * rate limiting from any single IP address. Returns undefined if no proxies
 * are configured, which causes Playwright to use the local IP.
 *
 * @returns Proxy configuration object or undefined for direct connection
 */
function nextProxy() {
  if (!proxies.length) return undefined;
  const proxy = proxies[proxyIdx % proxies.length];
  proxyIdx += 1;
  return { server: proxy };
}

/**
 * openPage - Launches browser and fetches HTML content from URL
 *
 * This is the main scraping function that:
 * 1. Launches a headless Chromium browser with stealth measures
 * 2. Configures realistic user agent to avoid detection
 * 3. Sets appropriate timeouts for reliability
 * 4. Navigates to the target URL and extracts HTML
 * 5. Properly closes the browser to prevent resource leaks
 *
 * The function is designed to be called for each scraping request to ensure
 * a fresh browser context and avoid session-based detection.
 *
 * @param url - Target URL to scrape (e.g., ChatGPT search result page)
 * @returns HTML content of the page as a string
 * @throws Error if navigation fails or times out
 *
 * Used by:
 * - chatgpt.ts: Scraping ChatGPT search results
 * - googleAI.ts: Scraping Google AI Overviews
 * - Future scrapers for other AI platforms
 */
export async function openPage(url: string): Promise<string> {
  // Launch browser with headless mode and optional proxy
  const browser = await chromium.launch({
    headless: true,
    proxy: nextProxy(),
  });

  // Create new page with realistic user agent
  // Using Chrome 114 UA string which is widely accepted
  const page: Page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  });

  // Set timeout to handle slow-loading pages
  // 25 seconds is generous for AI platforms that may take time to generate responses
  page.setDefaultNavigationTimeout(25_000);

  // Navigate to target URL and wait for DOM content
  // Using 'domcontentloaded' is faster than 'networkidle' and sufficient for our needs
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Extract full HTML content including dynamically generated elements
  const html = await page.content();

  // Always close browser to prevent memory leaks and resource exhaustion
  await browser.close();

  return html;
}

/**
 * resetContext - Resets proxy rotation state for testing
 *
 * This utility function is used in tests to ensure consistent behavior
 * by resetting the proxy index back to zero. Without this, tests could
 * have different outcomes based on the order they run.
 *
 * Called by:
 * - browser.test.ts: Test setup/teardown
 * - Integration tests that need predictable proxy behavior
 */
export async function resetContext() {
  proxyIdx = 0;
}
