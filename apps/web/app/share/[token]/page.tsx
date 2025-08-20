import { jwtVerify } from 'jose';
import fs from 'fs/promises';
import path from 'path';
import Heatmap from '../../dashboard/Heatmap';
import { detectPresence } from '@viberank/analysis/presence';
import { classify } from '@viberank/analysis/sentiment';
import { calcScore } from '@viberank/analysis/score';
import { htmlToText } from 'html-to-text';

export const dynamic = 'force-dynamic';

function getKey() {
  const secret = process.env.SHARE_JWT_SECRET || 'dev-only-insecure-secret';
  return new TextEncoder().encode(secret);
}

async function verify(token: string) {
  const { payload } = await jwtVerify(token, getKey());
  if (payload.t !== 'report-ro') throw new Error('bad scope');
  return true;
}

async function loadRows() {
  const root = process.cwd();
  const live = path.join(root, 'data', 'report.json');
  const golden = path.join(root, '..', '..', 'packages', 'eval', 'golden', 'samples.json');

  // Try live rows first
  try {
    const { rows } = JSON.parse(await fs.readFile(live, 'utf-8'));
    return rows as unknown[];
  } catch {
    // Fallback to golden samples
  }

  // Fallback: compute rows from golden (deterministic)
  const brand = await fs
    .readFile(path.join(root, '..', '..', 'data', 'brand.json'))
    .then((b) => JSON.parse(b.toString()))
    .catch(() => ({ name: 'Brand', altSpellings: [], competitors: [], products: [] }));
  const samples: unknown[] = JSON.parse(await fs.readFile(golden, 'utf-8'));
  process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';
  const rows: unknown[] = [];
  for (const s of samples) {
    const { present, authority } = detectPresence(s.html, brand);
    const text = htmlToText(s.html, { wordwrap: false });
    const sent = await classify(text);
    const b = calcScore({ present, authority, polarity: sent.polarity });
    rows.push({ query: s.query, surface: s.surface, score: b.score, present, authority });
  }
  return rows;
}

export default async function SharePage({ params }: { params: { token: string } }) {
  try {
    await verify(params.token);
  } catch {
    return <div className="p-10">Invalid or expired link.</div>;
  }

  const rows = await loadRows();
  return (
    <main className="max-w-6xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-semibold mb-4">VibeRank — Shared GEO Snapshot</h1>
      <Heatmap rows={rows} />
      <p className="opacity-60 text-sm mt-4">
        Read‑only snapshot. Generated from the latest report or golden samples.
      </p>
    </main>
  );
}
