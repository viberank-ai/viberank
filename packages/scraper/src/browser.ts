import { chromium } from 'playwright-extra';
import type { Page } from 'playwright-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const proxies = (process.env.PROXY_POOL || '').split(',').filter(Boolean);
let proxyIdx = 0;

function nextProxy() {
  if (!proxies.length) return undefined;
  const proxy = proxies[proxyIdx % proxies.length];
  proxyIdx += 1;
  return { server: proxy };
}

export async function openPage(url: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
    proxy: nextProxy(),
  });
  const page: Page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  });
  page.setDefaultNavigationTimeout(25_000);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const html = await page.content();
  await browser.close();
  return html;
}

/** Needed for test teardown */
export async function resetContext() {
  proxyIdx = 0;
}
