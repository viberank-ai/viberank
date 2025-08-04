import { openPage } from './browser';
import * as cheerio from 'cheerio';

export interface GoogleAIResult {
  answer: string;
  citations: string[];
  followUps: string[];
}

export async function googleAIOverview(query: string): Promise<GoogleAIResult> {
  const url = `https://www.google.com/search?hl=en&q=${encodeURIComponent(query)}&udm=14`;
  const html = await openPage(url);
  const $ = cheerio.load(html);

  const answer =
    $('[data-md="answer"]').text().trim() || $('div[data-attrid="wa:/description"]').text().trim();

  const citations = [];
  $('a[data-ved][ping]').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.startsWith('/url?')) {
      const u = new URL('https://google.com' + href);
      citations.push(u.searchParams.get('q') || '');
    }
  });

  const followUps = [];
  $('div[jscontroller] span').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length && t.endsWith('?')) followUps.push(t);
  });

  return { answer, citations: Array.from(new Set(citations)), followUps };
}

if (require.main === module) {
  (async () => {
    const query = process.argv[2] || 'test query';
    const result = await googleAIOverview(query);
    console.log(JSON.stringify(result, null, 2));
  })();
}
