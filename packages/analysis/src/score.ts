import { Brand } from '@viberank/types';
import { detectPresence } from './presence';
import { classify } from './sentiment';
import { htmlToText } from 'html-to-text';

export interface ScoreInput {
  present: boolean;
  authority: boolean;
  polarity: number; // -1 .. +1
}

export interface ScoreBreakdown {
  presenceFactor: number; // 0 or 1
  sentimentFactor: number; // 0..1
  authorityFactor: number; // 0..1
  score: number; // 0..100 integer
}

/** Map -1..1 to 0..1 with neutral ~0.5 */
export function toSentimentFactor(polarity: number): number {
  const n = (polarity + 1) / 2;
  return Math.min(1, Math.max(0, n));
}

/**
 * Core formula:
 *   score = 100 * presenceFactor * sentimentFactor * authorityFactor
 *
 * presenceFactor   = present ? 1 : 0
 * sentimentFactor  = toSentimentFactor(polarity)
 * authorityFactor  = authority ? 1 : AUTH_MISS_WEIGHT
 *
 * AUTH_MISS_WEIGHT softens the penalty when not cited (default 0.6),
 * keeping non-cited but positive answers above zero.
 */
export function calcScore(
  { present, authority, polarity }: ScoreInput,
  opts?: { authMissWeight?: number }
): ScoreBreakdown {
  const presenceFactor = present ? 1 : 0;
  const sentimentFactor = toSentimentFactor(polarity);
  const authorityFactor = authority ? 1 : (opts?.authMissWeight ?? defaultAuthMissWeight());
  const raw = presenceFactor * sentimentFactor * authorityFactor * 100;
  return {
    presenceFactor,
    sentimentFactor,
    authorityFactor,
    score: Math.round(raw),
  };
}

/** Read from env or default to 0.6 */
export function defaultAuthMissWeight(): number {
  const v = Number(process.env.SCORE_AUTH_MISS_WEIGHT ?? 0.6);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.6;
}

/**
 * Convenience: score straight from an answer's HTML and Brand metadata.
 * Uses VIBERANK-23 (presence) + VIBERANK-22 (sentiment).
 */
export async function scoreAnswerHtml(html: string, brand: Brand): Promise<ScoreBreakdown> {
  const { present, authority } = detectPresence(html, brand);
  const text = htmlToText(html, { wordwrap: false });
  const { polarity } = await classify(text);
  return calcScore({ present, authority, polarity });
}
