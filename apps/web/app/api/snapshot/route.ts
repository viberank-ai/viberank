import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import sanitizeHtml from 'sanitize-html';

import { detectPresence } from '@viberank/analysis/presence';
import { classify } from '@viberank/analysis/sentiment';
import { calcScore } from '@viberank/analysis/score';
import { htmlToText } from 'html-to-text';

async function readLatestSnapshots() {
  const dir = path.join(process.cwd(), 'data', 'snapshots');
  try {
    const files = await fs.readdir(dir);
    if (!files.length) return [];
    const newest = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ f, t: Number(f.match(/\d+/)?.[0] ?? 0) }))
      .sort((a, b) => b.t - a.t)[0]?.f;
    if (!newest) return [];
    const raw = await fs.readFile(path.join(dir, newest), 'utf-8');
    return JSON.parse(raw) as Array<{
      query: string;
      surface: string;
      answerHtml: string;
      citations: string[];
      answeredAt?: string;
    }>;
  } catch {
    return [];
  }
}

async function readGolden(query: string, surface: string) {
  const f = path.join(process.cwd(), 'packages', 'eval', 'golden', 'samples.json');
  try {
    const arr = JSON.parse(await fs.readFile(f, 'utf-8')) as {
      query: string;
      surface: string;
      html?: string;
    }[];
    const hit = arr.find((s) => s.query === query && s.surface === surface);
    if (!hit) return null;
    return {
      query,
      surface,
      answerHtml: String(hit.html || ''),
      citations: [],
      answeredAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';
  const surface = searchParams.get('surface') || '';
  if (!query || !surface) return new NextResponse('Bad request', { status: 400 });

  const brandPath = path.join(process.cwd(), 'data', 'brand.json');
  const brand = await fs
    .readFile(brandPath)
    .then((b) => JSON.parse(b.toString()))
    .catch(() => ({ name: 'Brand', altSpellings: [], competitors: [], products: [] }));

  // Prefer latest snapshot
  const snaps = await readLatestSnapshots();
  const found =
    snaps.find((s) => s.query === query && s.surface === surface) ||
    (await readGolden(query, surface));

  if (!found) return new NextResponse('Not found', { status: 404 });

  const answerHtml = sanitizeHtml(found.answerHtml || '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
  });
  const text = htmlToText(answerHtml, { wordwrap: false });

  // Deterministic analyzer on server
  process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

  const { present, authority } = detectPresence(answerHtml, brand);
  const sent = await classify(text);
  const breakdown = calcScore({ present, authority, polarity: sent.polarity });

  return NextResponse.json({
    query,
    surface,
    answeredAt: found.answeredAt || new Date().toISOString(),
    answerHtml, // sanitized
    citations: found.citations || [],
    metrics: {
      score: breakdown.score,
      present,
      authority,
      polarity: sent.polarity,
    },
  });
}
