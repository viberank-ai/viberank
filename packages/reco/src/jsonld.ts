import fs from 'fs/promises';
import path from 'path';
import { Brand } from '@viberank/types';

function orgJsonLd(brand: Brand, url?: string) {
  const website =
    url || process.env.BRAND_URL || `https://${brand.name.replace(/\s+/g, '').toLowerCase()}.com`;
  const sameAs = [] as string[];
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: website,
    sameAs,
  };
}

function productJsonLd(brand: Brand) {
  return brand.products.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brand.name} — ${p}`,
    brand: { '@type': 'Brand', name: brand.name },
  }));
}

function faqJsonLd(questions: string[]) {
  const top = questions.slice(0, 5);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: top.map((q) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: 'Answer this briefly with your product facts.' },
    })),
  };
}

export async function generateJsonLd(
  brandPath = 'data/brand.json',
  queriesPath = 'data/queries-tagged.json'
) {
  const brand: Brand = JSON.parse(await fs.readFile(brandPath, 'utf-8'));
  const qraw = await fs.readFile(queriesPath, 'utf-8').catch(() => '[]');
  const queries = JSON.parse(qraw) as unknown[];
  const qs = Array.isArray(queries)
    ? typeof queries[0] === 'string'
      ? queries
      : queries.map((r: { q: string }) => r.q)
    : [];

  const outDir = 'data/jsonld';
  await fs.mkdir(outDir, { recursive: true });

  const org = orgJsonLd(brand);
  const prods = productJsonLd(brand);
  const faq = faqJsonLd(qs.filter((q) => /what|how|why|price|cost|is\s/i.test(q)));

  await fs.writeFile(path.join(outDir, 'organization.jsonld'), JSON.stringify(org, null, 2));
  await fs.writeFile(path.join(outDir, 'products.jsonld'), JSON.stringify(prods, null, 2));
  await fs.writeFile(path.join(outDir, 'faq.jsonld'), JSON.stringify(faq, null, 2));

  return { org, prods, faq };
}
