/**
 * Evaluation Schema - Type definitions for golden sample validation
 *
 * This module defines the structure of golden samples used for testing and
 * validation of the brand monitoring pipeline. Golden samples are curated
 * examples of AI search responses with known expected analysis results.
 *
 * The schema ensures consistency across golden samples and provides type safety
 * for evaluation workflows. Each golden sample contains:
 * - Input data: HTML response, query, brand config
 * - Expected results: Presence, sentiment, authority, and final score
 *
 * Used for:
 * - packages/eval/run.ts: Validation against pipeline results
 * - packages/web/app/api/report/route.ts: Demo data for dashboard
 * - Quality assurance and regression testing
 * - Algorithm performance benchmarking
 *
 * The schema is designed to be forward-compatible with new AI platforms
 * while maintaining strict validation of expected analysis outcomes.
 */

import { z } from 'zod';

/**
 * GoldenItem - Schema for a single golden sample with expected analysis results
 *
 * Each golden item represents a complete test case for the brand monitoring
 * pipeline, including both input data and expected output values.
 *
 * Structure:
 * - Metadata: ID, surface, query for identification
 * - Input: Brand configuration and HTML content
 * - Expected: Ground truth values for validation
 *
 * The schema enforces data quality and enables automated validation
 * of analysis pipeline changes over time.
 */
export const GoldenItem = z.object({
  /** Unique identifier for tracking and debugging individual samples */
  id: z.string(),

  /** AI platform/surface this sample was collected from
   * Supports all major AI search platforms for comprehensive coverage */
  surface: z.enum(['google_ai', 'chatgpt', 'perplexity', 'other']),

  /** Original search query that produced this response
   * Used to understand query patterns and response relationships */
  query: z.string(),

  /** Brand configuration used for analysis
   * Embedded config ensures reproducible results even as brand.json changes */
  brand: z.object({
    /** Primary brand name for presence detection */
    name: z.string(),
    /** Alternative spellings and variations (optional) */
    altSpellings: z.array(z.string()).default([]),
    /** Known competitor names (optional) */
    competitors: z.array(z.string()).default([]),
  }),

  /** Raw HTML content from AI response (minimal snippet)
   * Contains enough content for analysis but not full page markup
   * Should include the AI-generated answer and any citation links */
  html: z.string(),

  /** Expected analysis results for validation
   * These are ground truth values determined by manual review */
  expected: z.object({
    /** Whether the brand should be detected as present in the content */
    present: z.boolean(),

    /** Whether the brand's website should be found in citation links
     * Indicates the AI used the brand as an authoritative source */
    authority: z.boolean(),

    /** Expected sentiment polarity range for VADER analysis (not LLM)
     * Provides tolerance for minor variations in sentiment scoring
     * Format: [min, max] where values are between -1 and 1 */
    polarityRange: z.tuple([z.number(), z.number()]),

    /** Expected final visibility score (0-100)
     * Based on current scoring formula: presence × sentiment × authority
     * Used to detect regressions in scoring algorithm */
    score: z.number(),
  }),
});

/**
 * TGoldenItem - TypeScript type for golden sample objects
 *
 * Provides type safety for code that processes golden samples.
 * Inferred from the Zod schema to ensure consistency between
 * runtime validation and compile-time type checking.
 */
export type TGoldenItem = z.infer<typeof GoldenItem>;
