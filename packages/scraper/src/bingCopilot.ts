import { openPage } from './browser';
import * as cheerio from 'cheerio';

export interface BingAIResult {
  answer: string;
  citations: string[];
}

interface Citation {
  url: string;
}

export async function bingCopilot(query: string): Promise<BingAIResult> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&showconv=1&FORM=hpcodx`;
  const html = await openPage(url);
  const $ = cheerio.load(html);
  const script = $('script[data-hveid]').html() || '';
  const match = script.match(/{"answer":.+?}/s);
  if (!match) return { answer: '', citations: [] };
  const json = JSON.parse(match[0]) as { answer?: string; citations?: Citation[] };
  return {
    answer: json.answer ?? '',
    citations: (json.citations ?? []).map((c: Citation) => c.url),
  };
}
