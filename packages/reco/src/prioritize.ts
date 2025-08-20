import fs from 'fs/promises';
import { Action } from './actions';

export interface RankedAction extends Action {
  impact: 1 | 2 | 3 | 4 | 5;
  confidence: 1 | 2 | 3 | 4 | 5;
  ice: number; // 0..100
}

function normTitle(t: string) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function defaultImpact(a: Action): 1 | 2 | 3 | 4 | 5 {
  // rough heuristic by type
  switch (a.type) {
    case 'Schema':
      return 4;
    case 'Content':
      return 4;
    case 'Internationalization':
      return 3;
    case 'Outreach':
      return 3;
    case 'Technical':
      return 3;
    case 'Reputation':
      return 2;
    default:
      return 3;
  }
}

function defaultConfidence(a: Action): 1 | 2 | 3 | 4 | 5 {
  // if backed by multiple hypotheses (related length), raise confidence
  if ((a.related?.length ?? 0) >= 2) return 4;
  return 3;
}

function iceScore(impact: number, confidence: number, effort: number) {
  return Math.round(((impact * confidence) / Math.max(1, effort)) * 10); // 0..100-ish
}

export function dedupeAndRank(actions: Action[]): RankedAction[] {
  const byKey = new Map<string, Action>();
  for (const a of actions) {
    const key = `${a.type}:${normTitle(a.title)}`;
    if (!byKey.has(key)) byKey.set(key, { ...a });
    else {
      const prev = byKey.get(key)!;
      prev.related = Array.from(new Set([...(prev.related || []), ...(a.related || [])]));
    }
  }
  const merged = Array.from(byKey.values());
  const ranked: RankedAction[] = merged.map((a) => {
    const impact = defaultImpact(a);
    const confidence = defaultConfidence(a);
    const ice = iceScore(impact, confidence, a.effort);
    return { ...a, impact, confidence, ice };
  });
  ranked.sort((a, b) => b.ice - a.ice);
  return ranked;
}

export async function prioritize(rawPath = 'data/actions.raw.json') {
  const actions = JSON.parse(await fs.readFile(rawPath, 'utf-8')) as Action[];
  const ranked = dedupeAndRank(actions);
  await fs.writeFile('data/recommendations.json', JSON.stringify(ranked, null, 2));
  // CSV too
  const csv = ['type,title,ice,impact,confidence,effort,related']
    .concat(
      ranked.map((a) =>
        [
          a.type,
          `"${a.title.replace(/"/g, '""')}"`,
          a.ice,
          a.impact,
          a.confidence,
          a.effort,
          `"${(a.related || []).join(' ')}"`,
        ].join(',')
      )
    )
    .join('\n');
  await fs.writeFile('data/recommendations.csv', csv);
  return ranked;
}
