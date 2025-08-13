import { it, expect, vi } from 'vitest';
import { extractCompetitors } from './competitors';
import { Brand } from '@viberank/types';

const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: (...args: unknown[]) => mockCreate(...args),
        },
      },
    })),
  };
});

it('returns competitor list', async () => {
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: '["Globex"]' } }],
  });

  const html = '<p>Unlike Globex, VibeRank is…</p>';
  const brand: Brand = {
    name: 'VibeRank',
    competitors: ['Globex'],
    altSpellings: [],
    products: [],
  };
  const res = await extractCompetitors(html, brand);
  expect(res).toContain('Globex');
});
