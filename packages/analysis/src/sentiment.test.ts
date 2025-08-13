import { it, expect, vi, beforeEach } from 'vitest';
import { classify } from './sentiment';

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

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockReset();
});

it('maps clear positive via VADER', async () => {
  const res = await classify('I absolutely love VibeRank, it is amazing!');
  expect(res.stance).toBe('positive');
  expect(res.polarity).toBeGreaterThan(0.5);
});

it('maps clear negative via VADER', async () => {
  const res = await classify('I hate this product, it is terrible and awful!');
  expect(res.stance).toBe('negative');
  expect(res.polarity).toBeLessThan(-0.5);
});

it('falls back to LLM when neutral', async () => {
  // mock OpenAI
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: 'mixed' } }],
  });

  const res = await classify('The product exists.');
  expect(res.stance).toBe('mixed');
  expect(mockCreate).toHaveBeenCalled();
});

it('uses VADER without LLM when magnitude is sufficient', async () => {
  const res = await classify('This is a great product with excellent features.');
  expect(res.stance).toBe('positive');
  expect(mockCreate).not.toHaveBeenCalled();
});
