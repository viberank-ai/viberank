#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { GoldenItem, TGoldenItem } from './schema';
import { detectPresence } from '../analysis/src/presence';
import { classify } from '../analysis/src/sentiment';
import { calcScore } from '../analysis/src/score';
import { htmlToText } from 'html-to-text';

const TOLERANCE = Number(process.env.EVAL_TOLERANCE ?? 5);

async function evalOne(item: TGoldenItem) {
  const presence = detectPresence(item.html, item.brand);
  const text = htmlToText(item.html, { wordwrap: false });
  const sent = await classify(text); // obeys ANALYSIS_DISABLE_LLM=1
  const score = calcScore({
    present: presence.present,
    authority: presence.authority,
    polarity: sent.polarity,
  });

  const withinPolarity =
    sent.polarity >= item.expected.polarityRange[0] &&
    sent.polarity <= item.expected.polarityRange[1];

  const scoreDelta = Math.abs(score.score - item.expected.score);
  return {
    id: item.id,
    sent: sent.polarity.toFixed(3),
    score: score.score,
    pass: withinPolarity && scoreDelta <= TOLERANCE,
    details: { withinPolarity, scoreDelta },
  };
}

async function main() {
  // deterministic mode
  process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

  const file = path.join(__dirname, 'golden', 'samples.json');
  const raw = await fs.readFile(file, 'utf-8');
  const arr = JSON.parse(raw) as unknown[];
  const items = arr.map((x) => GoldenItem.parse(x));

  const results = [];
  for (const item of items) {
    results.push(await evalOne(item));
  }

  const failed = results.filter((r) => !r.pass);
  console.table(results, ['id', 'sent', 'score', 'pass']);

  if (failed.length > 0) {
    console.error(`❌ Eval failed for ${failed.length} item(s). Tolerance = ±${TOLERANCE}`);
    process.exit(1);
  } else {
    console.log('✅ Eval passed');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
