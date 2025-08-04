import { vi, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { bingCopilot } from './bingCopilot';

it('parses answer & citations', async () => {
  vi.mock('./browser', () => ({
    openPage: async () =>
      fs.readFileSync(path.join(__dirname, '../test/bingCopilot.fixture.html'), 'utf8'),
  }));

  const res = await bingCopilot('dummy');
  expect(res.answer).toBeTruthy();
  expect(res.citations.length).toBeGreaterThan(0);
});
