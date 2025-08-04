import { describe, expect, vi, it, beforeEach } from 'vitest';
import { translate, deduplicate } from './translateDedup';

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

describe('translateDedup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('translate', () => {
    it('translates English queries to Spanish', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                '¿Qué hace que los Widgets de Acme sean mejores?\n¿Cómo funcionan los Widgets de Acme?',
            },
          },
        ],
      });

      const englishQueries = ['What makes Acme Widgets better?', 'How do Acme Widgets work?'];

      const result = await translate(englishQueries, 'es');

      expect(result).toEqual([
        '¿Qué hace que los Widgets de Acme sean mejores?',
        '¿Cómo funcionan los Widgets de Acme?',
      ]);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Translate each line to Spanish preserving meaning and keywords.',
          },
          { role: 'user', content: 'What makes Acme Widgets better?\nHow do Acme Widgets work?' },
        ],
      });
    });

    it('translates English queries to French', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                "Qu'est-ce qui rend les Widgets Acme meilleurs?\nComment fonctionnent les Widgets Acme?",
            },
          },
        ],
      });

      const englishQueries = ['What makes Acme Widgets better?', 'How do Acme Widgets work?'];

      const result = await translate(englishQueries, 'fr');

      expect(result).toEqual([
        "Qu'est-ce qui rend les Widgets Acme meilleurs?",
        'Comment fonctionnent les Widgets Acme?',
      ]);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Translate each line to French preserving meaning and keywords.',
          },
          { role: 'user', content: 'What makes Acme Widgets better?\nHow do Acme Widgets work?' },
        ],
      });
    });

    it('handles empty responses gracefully', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await translate(['test query'], 'es');
      expect(result).toEqual([]);
    });

    it('filters out empty lines', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'Query 1\n\n   \nQuery 2\n',
            },
          },
        ],
      });

      const result = await translate(['test'], 'es');
      expect(result).toEqual(['Query 1', 'Query 2']);
    });
  });

  describe('deduplicate', () => {
    it('removes duplicate queries', () => {
      const queries = [
        'What makes Acme better?',
        'How do Acme Widgets work?',
        'What makes Acme better?', // duplicate
        '¿Qué hace que Acme sea mejor?',
        'How do Acme Widgets work?', // duplicate
      ];

      const result = deduplicate(queries);

      expect(result).toEqual([
        'What makes Acme better?',
        'How do Acme Widgets work?',
        '¿Qué hace que Acme sea mejor?',
      ]);
    });

    it('preserves order of first occurrence', () => {
      const queries = ['B', 'A', 'C', 'A', 'B'];
      const result = deduplicate(queries);
      expect(result).toEqual(['B', 'A', 'C']);
    });

    it('handles empty array', () => {
      const result = deduplicate([]);
      expect(result).toEqual([]);
    });

    it('handles array with no duplicates', () => {
      const queries = ['A', 'B', 'C'];
      const result = deduplicate(queries);
      expect(result).toEqual(['A', 'B', 'C']);
    });
  });
});
