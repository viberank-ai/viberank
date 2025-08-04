import type { Brand } from '../../types/src/brand';
import OpenAI from 'openai';
import crypto from 'node:crypto';
import fs from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQueries(brand: Brand): Promise<string[]> {
  const system = 'You are an SEO expert generating search queries.';
  const user = `
    Brand: ${brand.name}
    Competitors: ${brand.competitors.join(', ')}
    Products: ${brand.products.join(', ')}
    Generate question, comparison, and best-for-X queries.
    Return as newline list, no numbering, 200 items.
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = completion.choices[0].message?.content || '';
  const list = raw
    .split('\n')
    .map((q) => q.trim())
    .filter(Boolean);
  // quick dedupe
  return Array.from(new Set(list)).slice(0, 200);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const brand: Brand = JSON.parse(await fs.readFile('data/brand.json', 'utf-8'));
    const queries = await generateQueries(brand);
    await fs.mkdir('data', { recursive: true });
    await fs.writeFile(
      `data/queries-en-${crypto.randomUUID().slice(0, 8)}.json`,
      JSON.stringify(queries, null, 2)
    );
    console.log(`✅ Generated ${queries.length} queries`);
  })();
}
