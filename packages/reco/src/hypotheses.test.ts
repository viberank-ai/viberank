import { it, expect, vi } from 'vitest';
import fs from 'fs/promises';
import { generateHypotheses } from './hypotheses';

vi.mock('@viberank/analysis', () => ({
  classify: async () => ({ polarity: -0.1, stance: 'negative' }),
}));

it('produces hypotheses and writes findings.json', async () => {
  const tmpReport = 'data/report.json';
  const tmpBrand = 'data/brand.json';
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(
    tmpReport,
    JSON.stringify({
      rows: [
        {
          query: 'what is viberank',
          surface: 'google_ai',
          score: 40,
          present: true,
          authority: false,
        },
        {
          query: 'viberank vs globex',
          surface: 'bing_copilot',
          score: 45,
          present: true,
          authority: false,
        },
        {
          query: 'is viberank legit',
          surface: 'perplexity',
          score: 20,
          present: false,
          authority: false,
        },
      ],
    })
  );
  await fs.writeFile(
    tmpBrand,
    JSON.stringify({
      name: 'VibeRank',
      altSpellings: ['Vibe Rank'],
      products: ['dashboard'],
      competitors: ['Globex'],
    })
  );

  const out = await generateHypotheses(tmpReport, tmpBrand);
  expect(out.length).toBeGreaterThan(0);
  const codes = out.map((h) => h.code);
  expect(codes).toContain('NO_AUTHORITY_CITATION');
  expect(codes).toContain('NO_BRAND_MENTION');
});
