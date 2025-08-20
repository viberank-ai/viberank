/**
 * Report API Route - Processes golden samples for dashboard display
 *
 * This endpoint analyzes pre-collected "golden" samples (test data) to populate
 * the dashboard heat-map. Golden samples are curated examples stored in
 * packages/eval/golden/samples.json that represent typical AI responses.
 *
 * Flow:
 * 1. Load golden samples from eval package
 * 2. Analyze each sample for brand presence and sentiment
 * 3. Calculate visibility scores
 * 4. Return rows for heat-map display
 *
 * Used by:
 * - app/dashboard/page.tsx: Fetches data on page load
 * - Testing: Validates analysis pipeline with known samples
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { detectPresence } from '../../../../../packages/analysis/src/presence';
import { classify } from '../../../../../packages/analysis/src/sentiment';
import { calcScore } from '../../../../../packages/analysis/src/score';
import { htmlToText } from 'html-to-text';

// Force deterministic sentiment analysis (no LLM) for consistent results
// This ensures golden samples always produce the same scores
process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

/**
 * Row - Analysis result for one query×surface combination
 * Matches the AnalysisRow type but includes 'other' surface for flexibility
 */
type Row = {
  /** Search query that was analyzed */
  query: string;
  /** AI platform that provided the response */
  surface: 'google_ai' | 'chatgpt' | 'perplexity' | 'other';
  /** Visibility score 0-100 for heat-map coloring */
  score: number;
  /** Whether brand was mentioned */
  present: boolean;
  /** Whether brand website was cited */
  authority: boolean;
};

/**
 * Sample - Structure of golden sample data from eval package
 * These are pre-collected AI responses used for testing/demo
 */
interface Sample {
  /** The search query that was submitted */
  query: string;
  /** Which AI platform responded */
  surface: string;
  /** Raw HTML of the AI's response */
  html: string;
  /** Brand configuration for this sample */
  brand: { name: string; altSpellings: string[] };
}

/**
 * GET /api/report - Analyzes golden samples and returns scores
 *
 * This endpoint serves as the data source for the dashboard's initial
 * heat-map display. It processes pre-collected samples rather than
 * running live scrapes, making it fast and reliable for demos.
 *
 * @returns JSON with rows array containing analyzed samples
 */
export async function GET() {
  // Navigate from apps/web to repo root, then to packages/eval
  // This path traversal is necessary due to the monorepo structure
  const root = path.resolve(process.cwd(), '..', '..');
  const file = path.join(root, 'packages', 'eval', 'golden', 'samples.json');

  // Load golden samples - these are curated test cases
  const raw = await fs.readFile(file, 'utf-8');
  const samples: Sample[] = JSON.parse(raw);

  // Process each sample through the analysis pipeline
  const rows: Row[] = [];
  for (const s of samples) {
    // Step 1: Detect brand presence and check for website citations
    const { present, authority } = detectPresence(s.html, s.brand);

    // Step 2: Convert HTML to plain text for sentiment analysis
    const text = htmlToText(s.html, { wordwrap: false });

    // Step 3: Analyze sentiment (deterministic mode, no LLM)
    const sent = await classify(text);

    // Step 4: Calculate final visibility score (0-100)
    const breakdown = calcScore({ present, authority, polarity: sent.polarity });

    // Build row for dashboard display
    rows.push({
      query: s.query,
      surface: s.surface as Row['surface'],
      score: breakdown.score,
      present,
      authority,
    });
  }

  // Return analyzed rows for heat-map rendering
  return NextResponse.json({ rows });
}
