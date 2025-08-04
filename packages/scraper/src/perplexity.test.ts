import { expect, it, vi } from 'vitest';
import { perplexitySearch } from './perplexity';

vi.mock('got', () => ({
  default: {
    post: vi.fn().mockReturnValue({
      json: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content:
                'This is a test answer from Perplexity.\n\nFollow-up questions:\n- What are the implications?\n- How does this work?',
            },
          },
        ],
        citations: ['https://example.com/source1', 'https://example.com/source2'],
      }),
    }),
  },
}));

it('returns formatted perplexity search results', async () => {
  const result = await perplexitySearch('test query', 'fake-api-key');

  expect(result.answer).toBe(
    'This is a test answer from Perplexity.\n\nFollow-up questions:\n- What are the implications?\n- How does this work?'
  );
  expect(result.citations).toEqual(['https://example.com/source1', 'https://example.com/source2']);
  expect(result.followUps).toEqual(['- What are the implications?', '- How does this work?']);
});

it('handles missing fields gracefully', async () => {
  const got = await import('got');
  vi.mocked(got.default.post).mockReturnValueOnce({
    json: vi.fn().mockResolvedValue({}),
  } as { json: () => Promise<Record<string, unknown>> });

  const result = await perplexitySearch('test query', 'fake-api-key');

  expect(result.answer).toBe('');
  expect(result.citations).toEqual([]);
  expect(result.followUps).toEqual([]);
});

it('throws error when no API key provided', async () => {
  await expect(perplexitySearch('test query')).rejects.toThrow('Perplexity API key is required');
});
