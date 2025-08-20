#!/usr/bin/env node
/**
 * Evaluation Runner - Validates analysis pipeline against golden samples
 *
 * This is the main evaluation script that tests the brand monitoring pipeline
 * against curated golden samples to ensure consistent and accurate results.
 * It's critical for maintaining quality as the analysis algorithms evolve.
 *
 * The evaluation process:
 * 1. Loads golden samples with expected results
 * 2. Runs the full analysis pipeline (presence, sentiment, scoring)
 * 3. Compares actual results against expected values
 * 4. Reports pass/fail status with detailed metrics
 *
 * Used for:
 * - Continuous integration testing
 * - Algorithm regression detection
 * - Performance benchmarking across pipeline changes
 * - Validation of golden sample quality
 *
 * The script runs in deterministic mode by default (ANALYSIS_DISABLE_LLM=1)
 * to ensure reproducible results in CI/CD environments.
 */

import fs from 'fs/promises';
import path from 'path';
import { GoldenItem, TGoldenItem } from './schema';
import { detectPresence } from '../analysis/src/presence';
import { classify } from '../analysis/src/sentiment';
import { calcScore } from '../analysis/src/score';
import { htmlToText } from 'html-to-text';

// Score tolerance for pass/fail evaluation (configurable via environment)
// Default ±5 points allows for minor algorithmic variations while catching major regressions
const TOLERANCE = Number(process.env.EVAL_TOLERANCE ?? 5);

/**
 * evalOne - Evaluates a single golden sample through the analysis pipeline
 *
 * This function runs the complete brand analysis workflow on a single golden
 * sample and compares the results against expected values. It validates both
 * sentiment analysis accuracy and overall scoring consistency.
 *
 * Analysis steps:
 * 1. Detect brand presence and authority citations
 * 2. Extract text and analyze sentiment polarity
 * 3. Calculate final visibility score using scoring algorithm
 * 4. Compare results against expected ranges
 *
 * Pass criteria:
 * - Sentiment polarity within expected range
 * - Final score within tolerance (±5 points by default)
 *
 * @param item - Golden sample with HTML, brand config, and expected results
 * @returns Evaluation result with pass/fail status and detailed metrics
 *
 * The function respects ANALYSIS_DISABLE_LLM=1 for deterministic sentiment analysis,
 * ensuring consistent results across multiple runs and CI environments.
 */
async function evalOne(item: TGoldenItem) {
  // Step 1: Detect brand presence and authority citations
  const presence = detectPresence(item.html, item.brand);

  // Step 2: Extract text content and analyze sentiment
  const text = htmlToText(item.html, { wordwrap: false });
  const sent = await classify(text); // Respects ANALYSIS_DISABLE_LLM=1 for deterministic results

  // Step 3: Calculate final visibility score
  const score = calcScore({
    present: presence.present,
    authority: presence.authority,
    polarity: sent.polarity,
  });

  // Validation 1: Check if sentiment polarity is within expected range
  const withinPolarity =
    sent.polarity >= item.expected.polarityRange[0] &&
    sent.polarity <= item.expected.polarityRange[1];

  // Validation 2: Check if final score is within tolerance
  const scoreDelta = Math.abs(score.score - item.expected.score);

  return {
    id: item.id,
    sent: sent.polarity.toFixed(3),
    score: score.score,
    pass: withinPolarity && scoreDelta <= TOLERANCE,
    details: { withinPolarity, scoreDelta },
  };
}

/**
 * main - Orchestrates the complete evaluation process
 *
 * This function loads all golden samples, runs evaluation on each one,
 * and provides a summary report of results. It's designed to be used
 * in CI/CD pipelines where a non-zero exit code indicates test failure.
 *
 * Process:
 * 1. Enable deterministic mode for consistent testing
 * 2. Load and parse golden samples from JSON file
 * 3. Run evaluation on each sample
 * 4. Display results in tabular format
 * 5. Exit with appropriate status code
 *
 * Environment variables:
 * - ANALYSIS_DISABLE_LLM: Forced to '1' for deterministic results
 * - EVAL_TOLERANCE: Score tolerance for pass/fail (default: 5)
 *
 * Output format:
 * - Table showing sample ID, sentiment, score, and pass/fail status
 * - Summary message indicating overall success or failure
 * - Exit code 0 for success, 1 for failure (standard for CI/CD)
 */
async function main() {
  // Force deterministic mode for consistent evaluation results
  // This ensures sentiment analysis doesn't use variable LLM calls
  process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

  // Load golden samples from the curated dataset
  const file = path.join(__dirname, 'golden', 'samples.json');
  const raw = await fs.readFile(file, 'utf-8');
  const arr = JSON.parse(raw) as unknown[];

  // Parse and validate golden samples using Zod schema
  const items = arr.map((x) => GoldenItem.parse(x));

  // Run evaluation on all samples
  const results = [];
  for (const item of items) {
    results.push(await evalOne(item));
  }

  // Identify failed samples for reporting
  const failed = results.filter((r) => !r.pass);

  // Display results in tabular format for easy analysis
  console.table(results, ['id', 'sent', 'score', 'pass']);

  // Report final status and exit with appropriate code
  if (failed.length > 0) {
    console.error(`❌ Eval failed for ${failed.length} item(s). Tolerance = ±${TOLERANCE}`);
    process.exit(1);
  } else {
    console.log('✅ Eval passed');
  }
}

// Execute main function with error handling
// Any uncaught errors result in exit code 1 for CI/CD failure detection
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
