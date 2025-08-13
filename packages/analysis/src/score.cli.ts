#!/usr/bin/env node

// Standalone CLI to avoid import dependencies
interface ScoreInput {
  present: boolean;
  authority: boolean;
  polarity: number; // -1 .. +1
}

interface ScoreBreakdown {
  presenceFactor: number; // 0 or 1
  sentimentFactor: number; // 0..1
  authorityFactor: number; // 0..1
  score: number; // 0..100 integer
}

function toSentimentFactor(polarity: number): number {
  const n = (polarity + 1) / 2;
  return Math.min(1, Math.max(0, n));
}

function calcScore(
  { present, authority, polarity }: ScoreInput,
  opts?: { authMissWeight?: number }
): ScoreBreakdown {
  const presenceFactor = present ? 1 : 0;
  const sentimentFactor = toSentimentFactor(polarity);
  const authorityFactor = authority ? 1 : (opts?.authMissWeight ?? 0.6);
  const raw = presenceFactor * sentimentFactor * authorityFactor * 100;
  return {
    presenceFactor,
    sentimentFactor,
    authorityFactor,
    score: Math.round(raw),
  };
}

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
const present = args.present === 'true';
const authority = args.authority === 'true';
const polarity = Number(args.polarity ?? 0);
const res = calcScore({ present, authority, polarity });
console.log(JSON.stringify(res, null, 2));
