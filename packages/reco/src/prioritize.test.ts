import { expect, it } from 'vitest';
import { dedupeAndRank } from './prioritize';

it('dedupes by type+title and computes ICE', () => {
  const out = dedupeAndRank([
    {
      id: '1',
      type: 'Schema',
      title: 'Add Organization JSON-LD',
      description: '',
      steps: [],
      related: ['h1'],
      effort: 2,
    },
    {
      id: '2',
      type: 'Schema',
      title: 'Add organization json ld',
      description: '',
      steps: [],
      related: ['h2'],
      effort: 2,
    },
  ]);
  expect(out.length).toBe(1);
  expect(out[0].ice).toBeGreaterThan(0);
});
