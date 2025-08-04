import { expect, it, vi, beforeEach } from 'vitest';

interface LaunchOptions {
  proxy?: { server: string };
}

beforeEach(() => {
  vi.clearAllMocks();
});

it('cycles proxies', async () => {
  process.env.PROXY_POOL = 'http://p1:8080,http://p2:8080';
  const launches: LaunchOptions[] = [];

  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue({
      goto: vi.fn(),
      content: vi.fn().mockResolvedValue('<html></html>'),
      setDefaultNavigationTimeout: vi.fn(),
    }),
    close: vi.fn(),
  };

  const mockChromium = {
    use: vi.fn(),
    launch: vi.fn().mockImplementation((opts: LaunchOptions) => {
      launches.push(opts);
      return Promise.resolve(mockBrowser);
    }),
  };

  vi.doMock('playwright-extra', () => ({
    chromium: mockChromium,
  }));

  // Dynamic import to pick up the mock
  const { openPage, resetContext } = await import('./browser');

  await openPage('https://example.com');
  await openPage('https://example.com');

  expect(launches[0].proxy?.server).toBe('http://p1:8080');
  expect(launches[1].proxy?.server).toBe('http://p2:8080');

  await resetContext();
});
