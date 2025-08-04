import OpenAI from 'openai';
import fs from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function translate(list: string[], lang: 'es' | 'fr'): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Translate each line to ${lang} preserving meaning and keywords.`,
      },
      { role: 'user', content: list.join('\n') },
    ],
  });

  const content = completion.choices[0].message?.content;
  return (
    content
      ?.split('\n')
      .map((s) => s.trim())
      .filter(Boolean) ?? []
  );
}

export async function translateAndDedupe(inputFilePath: string): Promise<string[]> {
  const en: string[] = JSON.parse(await fs.readFile(inputFilePath, 'utf-8'));
  const es = await translate(en, 'es');
  const fr = await translate(en, 'fr');
  const deduped = Array.from(new Set([...en, ...es, ...fr]));
  return deduped;
}

if (require.main === module) {
  (async () => {
    const inputFile = process.argv[2];
    if (!inputFile) {
      console.error('Usage: ts-node translateDedup.ts <input-file>');
      process.exit(1);
    }

    const deduped = await translateAndDedupe(inputFile);
    await fs.mkdir('data', { recursive: true });
    await fs.writeFile('data/queries-multilingual.json', JSON.stringify(deduped, null, 2));
    console.log(`✅ Total unique queries: ${deduped.length}`);
  })();
}
