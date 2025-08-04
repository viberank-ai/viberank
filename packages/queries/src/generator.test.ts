import { describe, expect, vi, it, beforeEach } from 'vitest';
import { generateQueries } from './generator';
import { Brand } from '@viberank/types/brand';

// Create a mock that can be changed per test
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

describe('generateQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deduplicates queries', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'foo\nfoo\nbar',
          },
        },
      ],
    });

    const brand: Brand = {
      name: 'Foo',
      altSpellings: [],
      products: [],
      competitors: [],
    };

    const queries = await generateQueries(brand);
    expect(queries).toEqual(['foo', 'bar']);
  });

  it('limits to 200 queries maximum', async () => {
    // Mock OpenAI to return 250 unique queries
    const mockQueries = Array.from({ length: 250 }, (_, i) => `query${i}`);

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockQueries.join('\n'),
          },
        },
      ],
    });

    const brand: Brand = {
      name: 'Test',
      altSpellings: [],
      products: ['Product1'],
      competitors: ['Competitor1'],
    };

    const queries = await generateQueries(brand);
    expect(queries).toHaveLength(200);
  });

  it('filters empty lines', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'query1\n\n\nquery2\n   \nquery3',
          },
        },
      ],
    });

    const brand: Brand = {
      name: 'Test',
      altSpellings: [],
      products: [],
      competitors: [],
    };

    const queries = await generateQueries(brand);
    expect(queries).toEqual(['query1', 'query2', 'query3']);
  });
});
