import { z } from 'zod';

/**
 * Brand Schema - Core brand configuration for the VibeRank system
 *
 * This schema defines the brand entity that is being monitored across AI search engines.
 * It's used throughout the system to:
 * - Detect brand presence in AI-generated responses (analysis/src/presence.ts)
 * - Identify competitor mentions (analysis/src/competitors.ts)
 * - Calculate brand authority scores (analysis/src/score.ts)
 *
 * The brand data is loaded from data/brand.json and used by:
 * - pipeline/src/runScan.ts: Main orchestration that analyzes scraped content
 * - web/app/api/report/route.ts: API endpoint that processes golden samples
 */
export const BrandSchema = z.object({
  /** Primary brand name (e.g., "VibeRank") - exact match used for detection */
  name: z.string(),

  /** Alternative spellings/variations (e.g., ["Vibe Rank", "VibeRank AI"])
   * Used to catch different ways the brand might be mentioned */
  altSpellings: z.array(z.string()).default([]),

  /** Product names associated with the brand (e.g., ["VibeRank Pro", "VibeRank Analytics"])
   * Used to detect product-specific mentions that indicate brand presence */
  products: z.array(z.string()).default([]),

  /** Known competitor brands (e.g., ["Globex", "Acme Corp"])
   * Used to identify competitive mentions and calculate relative positioning */
  competitors: z.array(z.string()).default([]),
});

/**
 * Brand type - TypeScript type derived from the Zod schema
 * Used throughout the codebase for type-safe brand data handling
 */
export type Brand = z.infer<typeof BrandSchema>;
