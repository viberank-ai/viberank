import { expect, it, vi } from 'vitest';
import { perplexitySearch } from './perplexity';

vi.mock('got', () => ({
  default: {
    post: vi.fn().mockReturnValue({
      json: vi.fn().mockResolvedValue({
        answer: 'This is a test answer from Perplexity.',
        sources: [{ url: 'https://example.com/source1' }, { url: 'https://example.com/source2' }],
        follow_up_questions: ['What are the implications?', 'How does this work?'],
      }),
    }),
  },
}));

it('returns formatted perplexity search results', async () => {
  const result = await perplexitySearch('test query');

  expect(result.answer).toBe('This is a test answer from Perplexity.');
  expect(result.citations).toEqual(['https://example.com/source1', 'https://example.com/source2']);
  expect(result.followUps).toEqual(['What are the implications?', 'How does this work?']);
});

it('handles missing fields gracefully', async () => {
  const got = await import('got');
  vi.mocked(got.default.post).mockReturnValueOnce({
    json: vi.fn().mockResolvedValue({}),
  } as { json: () => Promise<Record<string, unknown>> });

  const result = await perplexitySearch('test query');

  expect(result.answer).toBe('');
  expect(result.citations).toEqual([]);
  expect(result.followUps).toEqual([]);
});
