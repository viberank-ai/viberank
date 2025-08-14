import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { detectPresence } from '../../../../../packages/analysis/src/presence';
import { classify } from '../../../../../packages/analysis/src/sentiment';
import { calcScore } from '../../../../../packages/analysis/src/score';
import { htmlToText } from 'html-to-text';

// Ensure deterministic sentiment (no LLM) on the server
process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

type Row = {
  query: string;
  surface: 'google_ai' | 'bing_copilot' | 'chatgpt' | 'perplexity' | 'other';
  score: number;
  present: boolean;
  authority: boolean;
};

interface Sample {
  query: string;
  surface: string;
  html: string;
  brand: { name: string; altSpellings: string[] };
}

export async function GET() {
  // Navigate from apps/web to repo root, then to packages/eval
  const root = path.resolve(process.cwd(), '..', '..');
  const file = path.join(root, 'packages', 'eval', 'golden', 'samples.json');
  const raw = await fs.readFile(file, 'utf-8');
  const samples: Sample[] = JSON.parse(raw);

  const rows: Row[] = [];
  for (const s of samples) {
    const { present, authority } = detectPresence(s.html, s.brand);
    const text = htmlToText(s.html, { wordwrap: false });
    const sent = await classify(text);
    const breakdown = calcScore({ present, authority, polarity: sent.polarity });
    rows.push({
      query: s.query,
      surface: s.surface,
      score: breakdown.score,
      present,
      authority,
    });
  }
  return NextResponse.json({ rows });
}
