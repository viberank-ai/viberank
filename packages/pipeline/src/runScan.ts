#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';
import pLimit from 'p-limit';
import { Brand } from '@viberank/types/brand';
import { Snapshot, AnalysisRow, Surface } from '@viberank/types/snapshot';

import { googleAIOverview } from '../../scraper/src/googleAI';
import { bingCopilot } from '../../scraper/src/bingCopilot';
import { chatgptBrowse as chatGPTBrowse } from '../../scraper/src/chatgpt';
import { perplexitySearch } from '../../scraper/src/perplexity';

import { detectPresence } from '../../analysis/src/presence';
import { classify } from '../../analysis/src/sentiment';
import { extractCompetitors } from '../../analysis/src/competitors';
import { calcScore } from '../../analysis/src/score';
import { htmlToText } from 'html-to-text';

type Scraper = (
  q: string
) => Promise<{ answer: string; citations: string[]; followUps?: string[] }>;
const SCRAPERS: Record<Surface, Scraper> = {
  google_ai: googleAIOverview as Scraper,
  bing_copilot: bingCopilot as Scraper,
  chatgpt: chatGPTBrowse as Scraper,
  perplexity: perplexitySearch as Scraper,
};

export interface RunScanOpts {
  brandPath?: string;
  queriesPath?: string;
  surfaces?: Surface[];
  limit?: number;
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
  writeArtifacts?: boolean; // default true: write snapshots + report.json
}

interface QueryItem {
  q: string;
}

function nowIso() {
  return new Date().toISOString();
}

async function scrapeOne(surface: Surface, query: string): Promise<Snapshot | null> {
  try {
    const res = await SCRAPERS[surface](query);
    return {
      id: crypto.randomUUID(),
      surface,
      query,
      answeredAt: nowIso(),
      answerHtml: res.answer,
      citations: res.citations ?? [],
      followUps: res.followUps ?? [],
    };
  } catch (e) {
    console.warn(`! scrape failed: ${surface} :: ${query} — ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function analyzeOne(s: Snapshot, brand: Brand): Promise<AnalysisRow> {
  const { present, authority } = detectPresence(s.answerHtml, brand);
  const text = htmlToText(s.answerHtml, { wordwrap: false });
  // Deterministic analyzer by default (no LLM fallback)
  process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';
  const sent = await classify(text);
  const breakdown = calcScore({ present, authority, polarity: sent.polarity });
  // Fire-and-forget competitor extraction (not needed for score)
  extractCompetitors(s.answerHtml, brand).catch(() => {});
  return { query: s.query, surface: s.surface, score: breakdown.score, present, authority };
}

export async function runScan(
  opts: RunScanOpts = {}
): Promise<{ rows: AnalysisRow[]; snapshots: Snapshot[] }> {
  const brandPath = opts.brandPath ?? 'data/brand.json';
  const queriesPath = opts.queriesPath ?? 'data/queries-tagged.json';
  const surfaces: Surface[] = opts.surfaces ?? ['google_ai', 'bing_copilot', 'perplexity']; // skip chatgpt by default
  const limit = opts.limit ?? 20;
  const concurrency = opts.concurrency ?? 2;
  const onProgress = opts.onProgress ?? (() => {});
  const write = opts.writeArtifacts ?? true;

  const brand: Brand = JSON.parse(await fs.readFile(brandPath, 'utf8'));
  const raw = JSON.parse(await fs.readFile(queriesPath, 'utf8'));
  const queries: string[] = Array.isArray(raw)
    ? typeof raw[0] === 'string'
      ? raw
      : raw.map((r: QueryItem) => r.q)
    : [];

  const chosen = queries.slice(0, limit);
  const total = chosen.length * surfaces.length;

  const limitQ = pLimit(concurrency);
  let done = 0;

  const snapshots = (
    await Promise.all(
      chosen.flatMap((q) =>
        surfaces.map((s) =>
          limitQ(async () => {
            const snap = await scrapeOne(s, q);
            done += 1;
            onProgress(done, total);
            return snap;
          })
        )
      )
    )
  ).filter(Boolean) as Snapshot[];

  const rows: AnalysisRow[] = [];
  for (const s of snapshots) rows.push(await analyzeOne(s, brand));

  if (write) {
    await fs.mkdir('data/snapshots', { recursive: true });
    await fs.writeFile(
      path.join('data/snapshots', `snapshots-${Date.now()}.json`),
      JSON.stringify(snapshots, null, 2)
    );
    await fs.writeFile('data/report.json', JSON.stringify({ rows }, null, 2));
  }
  return { rows, snapshots };
}

// CLI wrapper
if (require.main === module) {
  (async () => {
    const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
    await runScan({
      limit: Number(args.limit ?? 20),
      surfaces: (args.surfaces?.split(',') as Surface[]) || undefined,
      concurrency: Number(args.concurrency ?? 2),
      brandPath: args.brand ?? 'data/brand.json',
      queriesPath: args.queries ?? 'data/queries-tagged.json',
      onProgress: (d, t) => process.stdout.write(`\rProgress ${d}/${t}`),
    });
    console.log('\n✅ wrote data/report.json');
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
