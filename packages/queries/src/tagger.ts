import fs from 'fs/promises';
import glob from 'fast-glob';
import OpenAI from 'openai';

export type Label = { q: string; intent: string; stage: string };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const intentKeywords = {
  transactional: [
    'buy',
    'price',
    'deal',
    'cost',
    'purchase',
    'affordable',
    'budget',
    'cheap',
    'expensive',
  ],
  comparative: [
    'vs',
    'compare',
    'alternative',
    'better',
    'versus',
    'against',
    'difference',
    'than',
  ],
  navigational: ['login', 'official', 'website', 'site', 'portal', 'dashboard'],
  informational: [],
};

export function heuristicIntent(q: string): string {
  const query = q.toLowerCase();
  for (const [intent, kws] of Object.entries(intentKeywords)) {
    if (kws.some((k) => query.includes(k))) return intent;
  }
  return 'informational';
}

export async function llmStage(q: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Classify funnel stage: awareness, consideration, purchase, support.',
      },
      { role: 'user', content: q },
    ],
  });
  const stage = response.choices[0].message?.content?.trim().toLowerCase() || 'awareness';

  // Normalize to expected values
  const validStages = ['awareness', 'consideration', 'purchase', 'support'];
  return validStages.includes(stage) ? stage : 'awareness';
}

export async function tagQueries(queries: string[]): Promise<Label[]> {
  const labels: Label[] = [];

  console.log(`🏷️  Tagging ${queries.length} queries...`);
  let processed = 0;

  for (const q of queries) {
    const intent = heuristicIntent(q);
    const stage = await llmStage(q);
    labels.push({ q, intent, stage });

    processed++;
    if (processed % 10 === 0) {
      console.log(`   Progress: ${processed}/${queries.length}`);
    }
  }

  return labels;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const files = await glob('data/queries-multilingual.json');
    if (files.length === 0) {
      console.error('❌ No multilingual queries file found');
      process.exit(1);
    }

    const file = files[0];
    console.log(`📥 Loading queries from ${file}`);

    const list: string[] = JSON.parse(await fs.readFile(file, 'utf-8'));
    console.log(`📊 Found ${list.length} queries to tag`);

    const labels = await tagQueries(list);

    await fs.writeFile('data/queries-tagged.json', JSON.stringify(labels, null, 2));

    // Generate summary statistics
    const intentCounts = labels.reduce(
      (acc, label) => {
        acc[label.intent] = (acc[label.intent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const stageCounts = labels.reduce(
      (acc, label) => {
        acc[label.stage] = (acc[label.stage] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log(`✅ Tagged ${labels.length} queries saved to data/queries-tagged.json`);
    console.log(`📈 Intent breakdown:`, intentCounts);
    console.log(`🎯 Stage breakdown:`, stageCounts);
  })();
}
