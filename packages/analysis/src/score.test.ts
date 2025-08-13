import { calcScore, toSentimentFactor } from './score';
import { describe, it, expect, vi } from 'vitest';

// Mock OpenAI to avoid initialization error
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('toSentimentFactor', () => {
  it('maps -1..1 to 0..1', () => {
    expect(toSentimentFactor(-1)).toBe(0);
    expect(toSentimentFactor(0)).toBe(0.5);
    expect(toSentimentFactor(1)).toBe(1);
  });
});

describe('calcScore', () => {
  it('gives 0 if not present', () => {
    const r = calcScore({ present: false, authority: true, polarity: 1 });
    expect(r.score).toBe(0);
  });

  it('reaches 100 for ideal signals', () => {
    const r = calcScore({ present: true, authority: true, polarity: 1 });
    expect(r.score).toBe(100);
  });

  it('applies soft penalty when not cited', () => {
    const r = calcScore({ present: true, authority: false, polarity: 0 }, { authMissWeight: 0.6 });
    // presence=1 * sentiment=0.5 * authority=0.6 * 100 = 30
    expect(r.score).toBe(30);
  });
});
