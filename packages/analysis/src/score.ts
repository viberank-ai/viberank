/**
 * Score Calculation Module - Converts analysis results into visibility scores
 *
 * This module implements the core scoring algorithm that determines how well
 * a brand is represented in AI search results. The score ranges from 0-100
 * and appears as color-coded cells in the dashboard heat-map.
 *
 * Scoring factors:
 * 1. Presence: Brand must be mentioned (binary factor)
 * 2. Sentiment: How positively/negatively the brand is discussed
 * 3. Authority: Whether the brand's website is cited as a source
 *
 * Used by:
 * - pipeline/src/runScan.ts: Line 82 - Calculates scores for each snapshot
 * - web/app/api/report/route.ts: Line 32 - Scores golden samples
 * - web/app/dashboard/Heatmap.tsx: Uses scores for color coding
 */

import { Brand } from '@viberank/types';
import { detectPresence } from './presence';
import { classify } from './sentiment';
import { htmlToText } from 'html-to-text';

/**
 * ScoreInput - Required data to calculate a brand visibility score
 *
 * These three factors are multiplied together to produce the final score
 */
export interface ScoreInput {
  /** Whether brand was mentioned (from presence.ts) */
  present: boolean;

  /** Whether brand website was cited (from presence.ts) */
  authority: boolean;

  /** Sentiment polarity from -1 (negative) to +1 (positive) (from sentiment.ts) */
  polarity: number;
}

/**
 * ScoreBreakdown - Detailed scoring components and final score
 *
 * Provides transparency into how the score was calculated
 * Useful for debugging and understanding why a result scored high/low
 */
export interface ScoreBreakdown {
  /** 0 if not mentioned, 1 if mentioned */
  presenceFactor: number;

  /** 0-1 scale based on sentiment polarity */
  sentimentFactor: number;

  /** 1 if cited, configurable penalty (default 0.6) if not */
  authorityFactor: number;

  /** Final score 0-100 shown in heat-map */
  score: number;
}

/**
 * toSentimentFactor - Normalizes sentiment polarity to 0-1 scale
 *
 * Converts VADER's compound score (-1 to +1) to a multiplier:
 * - -1.0 (very negative) → 0.0 (kills the score)
 * - 0.0 (neutral) → 0.5 (half impact)
 * - +1.0 (very positive) → 1.0 (full score)
 *
 * @param polarity - VADER compound score from sentiment.ts
 * @returns Normalized factor for score calculation
 */
export function toSentimentFactor(polarity: number): number {
  // Linear mapping: add 1 to shift range to 0-2, then divide by 2
  const n = (polarity + 1) / 2;
  // Clamp to [0,1] range for safety
  return Math.min(1, Math.max(0, n));
}

/**
 * calcScore - Core scoring algorithm for brand visibility
 *
 * Formula: score = 100 * presenceFactor * sentimentFactor * authorityFactor
 *
 * Logic:
 * - If brand not mentioned: score = 0 (presenceFactor = 0)
 * - If mentioned with negative sentiment: low score (sentimentFactor < 0.5)
 * - If mentioned positively but not cited: medium score (authorityFactor = 0.6)
 * - If mentioned positively AND cited: high score (all factors near 1)
 *
 * The AUTH_MISS_WEIGHT (default 0.6) prevents non-cited mentions from scoring
 * too low. This recognizes that being mentioned positively without citation
 * is still valuable for brand visibility.
 *
 * @param input - Presence, authority, and sentiment data
 * @param opts - Optional config (authMissWeight override)
 * @returns ScoreBreakdown with all factors and final 0-100 score
 *
 * Called by:
 * - pipeline/src/runScan.ts: analyzeOne() after detecting presence/sentiment
 * - web/app/api/report/route.ts: Processing golden samples
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

/**
 * defaultAuthMissWeight - Configurable penalty for missing citations
 *
 * When a brand is mentioned but not cited as a source, this weight
 * reduces the score but doesn't eliminate it. Default 0.6 means:
 * - Cited mention: 100% of potential score
 * - Uncited mention: 60% of potential score
 *
 * Can be overridden via SCORE_AUTH_MISS_WEIGHT environment variable
 * for experimentation with different scoring strategies.
 *
 * @returns Weight factor between 0 and 1
 */
export function defaultAuthMissWeight(): number {
  const v = Number(process.env.SCORE_AUTH_MISS_WEIGHT ?? 0.6);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.6;
}

/**
 * scoreAnswerHtml - All-in-one scoring from raw HTML
 *
 * Convenience function that combines all analysis steps:
 * 1. Detects brand presence and authority (presence.ts)
 * 2. Extracts text and analyzes sentiment (sentiment.ts)
 * 3. Calculates final score using the core algorithm
 *
 * This is a higher-level function for when you have HTML but haven't
 * run the individual analysis steps yet.
 *
 * @param html - Raw HTML from AI response (Snapshot.answerHtml)
 * @param brand - Brand configuration for detection
 * @returns Complete score breakdown
 *
 * Note: Not currently used in production - pipeline and API routes
 * call the individual functions directly for more control
 */
export async function scoreAnswerHtml(html: string, brand: Brand): Promise<ScoreBreakdown> {
  const { present, authority } = detectPresence(html, brand);
  const text = htmlToText(html, { wordwrap: false });
  const { polarity } = await classify(text);
  return calcScore({ present, authority, polarity });
}
