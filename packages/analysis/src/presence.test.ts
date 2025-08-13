import { expect, it } from 'vitest';
import { detectPresence } from './presence';

import { Brand } from '@viberank/types';

const brand: Brand = {
  name: 'VibeRank',
  altSpellings: ['Vibe Rank'],
  products: [],
  competitors: [],
};

it('detects brand mention', () => {
  const res = detectPresence('<p>Try VibeRank today</p>', brand);
  expect(res.present).toBe(true);
});

it('detects authority link', () => {
  const res = detectPresence('<a href="https://viberank.com">site</a>', brand);
  expect(res.authority).toBe(true);
});
