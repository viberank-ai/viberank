import { openPage } from './browser';
import * as cheerio from 'cheerio';

export interface GoogleAIResult {
  answer: string;
  citations: string[];
  followUps: string[];
}

export async function googleAIOverview(query: string): Promise<GoogleAIResult> {
  const url = `https://www.google.com/search?hl=en&q=${encodeURIComponent(query)}`;
  const html = await openPage(url);
  const $ = cheerio.load(html);

  // Look for AI Overview content - try multiple approaches
  let answer = '';

  // Method 1: Look for text near "AI Overview"
  $('*').each((_, el) => {
    const text = $(el).text();
    if (text.includes('AI Overview') && !answer) {
      // Get the parent and look for substantial text content
      const parent = $(el).parent();
      const siblings = parent.siblings();
      siblings.each((_, sibling) => {
        const siblingText = $(sibling).text().trim();
        if (siblingText.length > 50 && !siblingText.includes('AI Overview')) {
          answer = siblingText;
          return false; // break
        }
      });
    }
  });

  // Method 2: Look for longer paragraphs in the main content area
  if (!answer) {
    $('div p, div div').each((_, el) => {
      const text = $(el).text().trim();
      if (
        text.length > 100 &&
        text.length < 2000 &&
        !text.includes('©') &&
        !text.includes('Wikipedia')
      ) {
        answer = text;
        return false; // break
      }
    });
  }

  // Extract citations from links
  const citations = [];
  $('a[href*="/url?"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?')) {
      try {
        const u = new URL('https://google.com' + href);
        const actualUrl = u.searchParams.get('q');
        if (actualUrl && actualUrl.startsWith('http')) {
          citations.push(actualUrl);
        }
      } catch {
        // ignore invalid URLs
      }
    }
  });

  // Extract follow-up questions
  const followUps = [];
  $('span, div').each((_, el) => {
    const text = $(el).text().trim();
    if (
      text.length > 10 &&
      text.length < 100 &&
      text.endsWith('?') &&
      !text.includes('OpenAI') &&
      !text.includes('Wikipedia')
    ) {
      followUps.push(text);
    }
  });

  return {
    answer: answer.substring(0, 1000), // Limit answer length
    citations: Array.from(new Set(citations)).slice(0, 10), // Limit citations
    followUps: Array.from(new Set(followUps)).slice(0, 5), // Limit follow-ups
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const query = process.argv[2] || 'test query';
    const result = await googleAIOverview(query);
    console.log(JSON.stringify(result, null, 2));
  })();
}
