import got from 'got';

export interface PerplexityResult {
  answer: string;
  citations: string[];
  followUps: string[];
}

export async function perplexitySearch(q: string): Promise<PerplexityResult> {
  const resp = await got
    .post('https://www.perplexity.ai/api/search', {
      json: { query: q },
      headers: { accept: 'application/json' },
    })
    .json<{
      answer?: string;
      sources?: Array<{ url: string }>;
      follow_up_questions?: string[];
    }>();
  return {
    answer: resp.answer ?? '',
    citations: resp.sources?.map((s) => s.url) ?? [],
    followUps: resp.follow_up_questions ?? [],
  };
}
