import OpenAI from 'openai';
import fs from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function translate(list: string[], lang: 'es' | 'fr'): Promise<string[]> {
  const langNames = { es: 'Spanish', fr: 'French' };
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Translate each line to ${langNames[lang]} preserving meaning and keywords.`,
      },
      { role: 'user', content: list.join('\n') },
    ],
  });
  return (
    response.choices[0].message?.content
      ?.split('\n')
      .map((s) => s.trim())
      .filter(Boolean) ?? []
  );
}

export function deduplicate(queries: string[]): string[] {
  return Array.from(new Set(queries));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const inputFile = process.argv[2];
    if (!inputFile) {
      console.error('Usage: tsx translateDedup.ts <input-file>');
      process.exit(1);
    }

    const en: string[] = JSON.parse(await fs.readFile(inputFile, 'utf-8'));
    console.log(`📥 Loaded ${en.length} English queries`);

    console.log('🔄 Translating to Spanish...');
    const es = await translate(en, 'es');
    console.log(`✅ Generated ${es.length} Spanish queries`);

    console.log('🔄 Translating to French...');
    const fr = await translate(en, 'fr');
    console.log(`✅ Generated ${fr.length} French queries`);

    const combined = [...en, ...es, ...fr];
    const deduped = deduplicate(combined);
    const duplicateCount = combined.length - deduped.length;
    const duplicatePercentage = ((duplicateCount / combined.length) * 100).toFixed(1);

    await fs.writeFile('data/queries-multilingual.json', JSON.stringify(deduped, null, 2));

    console.log(`✅ Total unique queries: ${deduped.length}`);
    console.log(`📊 Duplicates removed: ${duplicateCount} (${duplicatePercentage}%)`);
    console.log(`💾 Saved to data/queries-multilingual.json`);
  })();
}
