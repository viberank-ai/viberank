import { vi, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { googleAIOverview } from './googleAI';

it('parses answer & citations', async () => {
  vi.mock('./browser', () => ({
    openPage: async () =>
      fs.readFileSync(path.join(__dirname, '../test/googleAI.fixture.html'), 'utf8'),
  }));

  const res = await googleAIOverview('dummy');
  expect(res.answer).toMatch(/VibeRank/i);
  expect(res.citations.length).toBeGreaterThan(0);
  expect(res.citations).toContain('https://example.com/viberank-info');
  expect(res.citations).toContain('https://docs.viberank.com/overview');
  expect(res.citations).toContain('https://blog.viberank.com/features');
  expect(res.followUps).toContain('Is VibeRank free?');
  expect(res.followUps).toContain('How does VibeRank work?');
  expect(res.followUps).toContain('VibeRank vs competitors?');
  expect(res.followUps).not.toContain('Not a question');
});
