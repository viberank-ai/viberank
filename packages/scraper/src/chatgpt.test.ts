import { vi, it, expect, beforeEach } from 'vitest';
import { chatGPTBrowse } from './chatgpt';

// Mock playwright-extra
vi.mock('playwright-extra', () => ({
  chromium: {
    use: vi.fn(),
    launch: vi.fn(() => ({
      newContext: vi.fn(() => ({
        addCookies: vi.fn(),
        newPage: vi.fn(() => ({
          goto: vi.fn(),
          fill: vi.fn(),
          keyboard: {
            press: vi.fn(),
          },
          waitForSelector: vi.fn(),
          $eval: vi.fn(() => 'Mocked ChatGPT response about the test query'),
          $$eval: vi.fn(() => ['https://example.com/source1', 'https://example.com/source2']),
        })),
      })),
      close: vi.fn(),
    })),
  },
}));

vi.mock('playwright-extra-plugin-stealth', () => ({
  default: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('returns ChatGPT result with answer and citations', async () => {
  const result = await chatGPTBrowse('test query');

  expect(result).toEqual({
    answer: 'Mocked ChatGPT response about the test query',
    citations: ['https://example.com/source1', 'https://example.com/source2'],
  });
});
