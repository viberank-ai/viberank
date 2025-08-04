import { describe, expect, vi, it, beforeEach } from 'vitest';
import { heuristicIntent, llmStage, tagQueries } from './tagger';

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

describe('tagger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('heuristicIntent', () => {
    it('identifies transactional intent with price keywords', () => {
      expect(heuristicIntent('What is the price of Acme Widgets?')).toBe('transactional');
      expect(heuristicIntent('Where can I buy Acme Widgets?')).toBe('transactional');
      expect(heuristicIntent('Best budget Widget options: Acme vs. Globex')).toBe('transactional');
      expect(heuristicIntent('Are Acme Widgets affordable?')).toBe('transactional');
    });

    it('identifies comparative intent with comparison keywords', () => {
      expect(heuristicIntent('Acme vs. Globex: Which is better?')).toBe('comparative');
      expect(heuristicIntent('How do Acme Widgets compare to Globex?')).toBe('comparative');
      expect(heuristicIntent('What are alternatives to Acme Widgets?')).toBe('comparative');
      expect(heuristicIntent('Acme Widgets versus Globex performance')).toBe('comparative');
    });

    it('identifies navigational intent with site keywords', () => {
      expect(heuristicIntent('Acme Widgets official website')).toBe('navigational');
      expect(heuristicIntent('How to login to Acme portal?')).toBe('navigational');
      expect(heuristicIntent('Acme Widgets site navigation')).toBe('navigational');
    });

    it('defaults to informational intent for general queries', () => {
      expect(heuristicIntent('What are Acme Widgets?')).toBe('informational');
      expect(heuristicIntent('How do Acme Widgets work?')).toBe('informational');
      expect(heuristicIntent('Acme Widget features and benefits')).toBe('informational');
    });

    it('handles case insensitive matching', () => {
      expect(heuristicIntent('ACME VS GLOBEX')).toBe('comparative');
      expect(heuristicIntent('Buy ACME WIDGETS')).toBe('transactional');
    });

    it('handles multiple keyword matches (first match wins)', () => {
      expect(heuristicIntent('Buy Acme vs Globex comparison')).toBe('transactional');
    });
  });

  describe('llmStage', () => {
    it('classifies awareness stage queries', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'awareness' } }],
      });

      const result = await llmStage('What are Acme Widgets?');
      expect(result).toBe('awareness');
    });

    it('classifies consideration stage queries', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'consideration' } }],
      });

      const result = await llmStage('How do Acme Widgets compare to competitors?');
      expect(result).toBe('consideration');
    });

    it('classifies purchase stage queries', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'purchase' } }],
      });

      const result = await llmStage('Where can I buy Acme Widgets?');
      expect(result).toBe('purchase');
    });

    it('classifies support stage queries', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'support' } }],
      });

      const result = await llmStage('How to troubleshoot Acme Widget issues?');
      expect(result).toBe('support');
    });

    it('handles case insensitive responses', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'CONSIDERATION' } }],
      });

      const result = await llmStage('Test query');
      expect(result).toBe('consideration');
    });

    it('defaults to awareness for invalid responses', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'invalid_stage' } }],
      });

      const result = await llmStage('Test query');
      expect(result).toBe('awareness');
    });

    it('handles empty responses gracefully', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await llmStage('Test query');
      expect(result).toBe('awareness');
    });

    it('trims whitespace from responses', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '  purchase  ' } }],
      });

      const result = await llmStage('Test query');
      expect(result).toBe('purchase');
    });
  });

  describe('tagQueries', () => {
    it('tags a list of queries with intent and stage', async () => {
      mockCreate
        .mockResolvedValueOnce({ choices: [{ message: { content: 'awareness' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'consideration' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'purchase' } }] });

      const queries = [
        'What are Acme Widgets?',
        'Acme vs Globex comparison',
        'Buy Acme Widgets now',
      ];

      const result = await tagQueries(queries);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        q: 'What are Acme Widgets?',
        intent: 'informational',
        stage: 'awareness',
      });
      expect(result[1]).toEqual({
        q: 'Acme vs Globex comparison',
        intent: 'comparative',
        stage: 'consideration',
      });
      expect(result[2]).toEqual({
        q: 'Buy Acme Widgets now',
        intent: 'transactional',
        stage: 'purchase',
      });
    });

    it('handles empty query list', async () => {
      const result = await tagQueries([]);
      expect(result).toEqual([]);
    });

    it('processes queries in order', async () => {
      mockCreate
        .mockResolvedValueOnce({ choices: [{ message: { content: 'awareness' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'support' } }] });

      const queries = ['First query', 'Second query'];
      const result = await tagQueries(queries);

      expect(result[0].q).toBe('First query');
      expect(result[1].q).toBe('Second query');
    });
  });
});
