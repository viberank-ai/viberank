import { chromium } from 'playwright-extra';
import type { Page } from 'playwright-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

export interface ChatGPTResult {
  answer: string;
  citations: string[];
}

export async function chatGPTBrowse(query: string): Promise<ChatGPTResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'en-US',
    extraHTTPHeaders: { 'User-Agent': 'Mozilla/5.0' },
  });
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
  const page: Page = await context.newPage();
  await page.goto('https://chat.openai.com/?model=gpt-4o-browsing', {
    waitUntil: 'domcontentloaded',
  });
  await page.fill('textarea', query);
  await page.keyboard.press('Enter');
  await page.waitForSelector('div.markdown', { timeout: 45_000 });
  const answer = await page.$eval('div.markdown', (el) => el.textContent || '');
  const citations = await page.$$eval('a[href^="http"]', (els) =>
    els.map((e) => (e as HTMLAnchorElement).href).filter((v, i, a) => a.indexOf(v) === i)
  );
  await browser.close();
  return { answer, citations };
}
