import { expect, it } from 'vitest';
import { generateJsonLd } from './jsonld';
import fs from 'fs/promises';

it('writes organization/products/faq jsonld files', async () => {
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(
    'data/brand.json',
    JSON.stringify({ name: 'VibeRank', altSpellings: [], products: ['Dashboard'], competitors: [] })
  );
  await fs.writeFile(
    'data/queries-tagged.json',
    JSON.stringify(['what is viberank', 'viberank pricing'])
  );
  const out = await generateJsonLd();
  expect(out.org['@type']).toBe('Organization');
});
