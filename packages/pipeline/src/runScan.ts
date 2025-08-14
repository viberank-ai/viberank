#!/usr/bin/env node
/**
 * Pipeline Orchestration Module - Main scanning and analysis workflow
 *
 * This is the core engine of VibeRank that coordinates:
 * 1. Loading brand and query data
 * 2. Scraping AI search engines in parallel
 * 3. Analyzing responses for brand presence and sentiment
 * 4. Calculating visibility scores
 * 5. Saving results for dashboard display
 *
 * Can be run:
 * - As a CLI tool: `node runScan.js limit=10 surfaces=google_ai,bing_copilot`
 * - As a library: Called by web/app/api/scan/route.ts for on-demand scans
 * - In CI/testing: With ANALYSIS_DISABLE_LLM=1 for deterministic results
 *
 * Output:
 * - data/snapshots/*.json: Raw scraped data for historical analysis
 * - data/report.json: Analyzed scores for dashboard display
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';
import pLimit from 'p-limit';
import { Brand } from '@viberank/types/brand';
import { Snapshot, AnalysisRow, Surface } from '@viberank/types/snapshot';

import { detectPresence } from '../../analysis/src/presence';
import { classify } from '../../analysis/src/sentiment';
import { extractCompetitors } from '../../analysis/src/competitors';
import { calcScore } from '../../analysis/src/score';
import { htmlToText } from 'html-to-text';

/**
 * Scraper - Function signature for AI search engine scrapers
 *
 * Each scraper in scraper/src/* implements this interface to provide
 * consistent data regardless of the underlying platform's API/format.
 */
type Scraper = (
  q: string
) => Promise<{ answer: string; citations: string[]; followUps?: string[] }>;

/**
 * loadScraper - Dynamic scraper loading (currently disabled)
 *
 * Originally loaded scrapers dynamically based on surface type.
 * Currently throws immediately to force fallback to mock implementation
 * due to Next.js Edge runtime compatibility issues with Puppeteer.
 *
 * In production, this would dynamically import:
 * - scraper/src/googleAI.ts for 'google_ai'
 * - scraper/src/bingCopilot.ts for 'bing_copilot'
 * - scraper/src/chatgpt.ts for 'chatgpt'
 * - scraper/src/perplexity.ts for 'perplexity'
 *
 * @param surface - Which AI platform to load scraper for
 * @throws Always throws to trigger mock fallback in development
 */
const loadScraper = async (surface: Surface): Promise<Scraper> => {
  // Disabled to avoid Puppeteer static analysis issues in Next.js
  // Real scrapers would be loaded here in production
  throw new Error(`Scraper loading disabled to avoid static analysis issues: ${surface}`);
};

/**
 * RunScanOpts - Configuration options for the scanning pipeline
 *
 * Used by:
 * - web/app/api/scan/route.ts: Passes user-specified options
 * - CLI invocation: Parsed from command-line arguments
 */
export interface RunScanOpts {
  /** Path to brand.json file (default: 'data/brand.json') */
  brandPath?: string;

  /** Path to queries file (default: 'data/queries-tagged.json') */
  queriesPath?: string;

  /** Which AI platforms to scan (default: google_ai, bing_copilot, perplexity) */
  surfaces?: Surface[];

  /** Max number of queries to process (default: 20) */
  limit?: number;

  /** Max parallel scraping operations (default: 2) */
  concurrency?: number;

  /** Progress callback for real-time updates
   * Used by web/app/api/scan/route.ts to update job progress */
  onProgress?: (done: number, total: number) => void;

  /** Whether to save snapshots and report.json (default: true)
   * Set to false for testing or when results are handled differently */
  writeArtifacts?: boolean;
}

/**
 * QueryItem - Structure for query data in queries-tagged.json
 *
 * Queries can be either:
 * - Simple string array: ["query1", "query2"]
 * - Object array with metadata: [{"q": "query1"}, {"q": "query2"}]
 */
interface QueryItem {
  /** The search query text */
  q: string;
}

/**
 * nowIso - Helper to get current timestamp in ISO format
 * Used for snapshot.answeredAt timestamps
 */
function nowIso() {
  return new Date().toISOString();
}

/**
 * scrapeOne - Scrapes a single query from one AI surface
 *
 * Handles the scraping for one cell in the query×surface matrix.
 * Catches and logs errors gracefully to allow partial results.
 *
 * @param surface - Which AI platform to scrape
 * @param query - The search query to submit
 * @returns Snapshot with scraped data, or null if scraping failed
 *
 * Called by: runScan() for each query×surface combination
 */
async function scrapeOne(surface: Surface, query: string): Promise<Snapshot | null> {
  try {
    const scraper = await loadScraper(surface);
    const res = await scraper(query);
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

/**
 * analyzeOne - Analyzes a single snapshot for brand visibility
 *
 * Runs the full analysis pipeline on scraped content:
 * 1. Detect brand presence and authority (presence.ts)
 * 2. Analyze sentiment (sentiment.ts)
 * 3. Calculate visibility score (score.ts)
 * 4. Extract competitors (async, non-blocking)
 *
 * @param s - Snapshot with scraped HTML content
 * @param brand - Brand configuration for detection
 * @returns AnalysisRow with score and analysis results
 *
 * Called by: runScan() after all scraping is complete
 */
async function analyzeOne(s: Snapshot, brand: Brand): Promise<AnalysisRow> {
  // Check if brand is mentioned and if website is cited
  const { present, authority } = detectPresence(s.answerHtml, brand);

  // Convert HTML to plain text for sentiment analysis
  const text = htmlToText(s.answerHtml, { wordwrap: false });

  // Default to deterministic mode (no LLM) for consistent testing
  // Can be overridden by setting ANALYSIS_DISABLE_LLM=0
  process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

  // Analyze sentiment of the text
  const sent = await classify(text);

  // Calculate final visibility score (0-100)
  const breakdown = calcScore({ present, authority, polarity: sent.polarity });

  // Extract competitor mentions asynchronously (non-blocking)
  // Results are not used in scoring but may be useful for analysis
  extractCompetitors(s.answerHtml, brand).catch(() => {});

  return { query: s.query, surface: s.surface, score: breakdown.score, present, authority };
}

/**
 * runScan - Main orchestration function for the scanning pipeline
 *
 * This is the entry point that coordinates the entire workflow:
 * 1. Loads brand and query data from JSON files
 * 2. Scrapes each query across specified AI surfaces in parallel
 * 3. Analyzes all snapshots for brand visibility
 * 4. Saves results to filesystem (optional)
 *
 * Parallelization:
 * - Uses p-limit to control concurrent scraping operations
 * - Default concurrency of 2 to avoid rate limiting
 * - Progress updates via onProgress callback
 *
 * @param opts - Configuration options for the scan
 * @returns Object with analyzed rows and raw snapshots
 *
 * Called by:
 * - web/app/api/scan/route.ts: For on-demand dashboard scans
 * - CLI invocation: Direct execution via node runScan.js
 */
export async function runScan(
  opts: RunScanOpts = {}
): Promise<{ rows: AnalysisRow[]; snapshots: Snapshot[] }> {
  // Set default paths and options
  const brandPath = opts.brandPath ?? 'data/brand.json';
  const queriesPath = opts.queriesPath ?? 'data/queries-tagged.json';
  const surfaces: Surface[] = opts.surfaces ?? ['google_ai', 'bing_copilot', 'perplexity']; // ChatGPT skipped by default due to complexity
  const limit = opts.limit ?? 20;
  const concurrency = opts.concurrency ?? 2;
  const onProgress = opts.onProgress ?? (() => {});
  const write = opts.writeArtifacts ?? true;

  // Load brand configuration (name, alt spellings, competitors)
  const brand: Brand = JSON.parse(await fs.readFile(brandPath, 'utf8'));

  // Load queries - supports both string array and object array formats
  const raw = JSON.parse(await fs.readFile(queriesPath, 'utf8'));
  const queries: string[] = Array.isArray(raw)
    ? typeof raw[0] === 'string'
      ? raw // Simple string array
      : raw.map((r: QueryItem) => r.q) // Object array with 'q' field
    : [];

  // Select queries up to the limit
  const chosen = queries.slice(0, limit);

  // Calculate total operations for progress tracking
  const total = chosen.length * surfaces.length;

  // Create concurrency limiter to avoid overwhelming targets
  const limitQ = pLimit(concurrency);
  let done = 0;

  // Scrape all query×surface combinations in parallel (with concurrency limit)
  // Creates a matrix of scraping operations and flattens to single array
  const snapshots = (
    await Promise.all(
      chosen.flatMap((q) =>
        surfaces.map((s) =>
          limitQ(async () => {
            const snap = await scrapeOne(s, q);
            done += 1;
            onProgress(done, total); // Report progress for UI updates
            return snap;
          })
        )
      )
    )
  ).filter(Boolean) as Snapshot[]; // Remove failed scrapes (null values)

  // Analyze each snapshot sequentially (could be parallelized if needed)
  const rows: AnalysisRow[] = [];
  for (const s of snapshots) {
    rows.push(await analyzeOne(s, brand));
  }

  // Save artifacts to filesystem if requested (default: true)
  if (write) {
    // Create snapshots directory if it doesn't exist
    await fs.mkdir('data/snapshots', { recursive: true });

    // Save raw snapshots with timestamp for historical analysis
    await fs.writeFile(
      path.join('data/snapshots', `snapshots-${Date.now()}.json`),
      JSON.stringify(snapshots, null, 2)
    );

    // Save analyzed report for dashboard consumption
    await fs.writeFile('data/report.json', JSON.stringify({ rows }, null, 2));
  }

  return { rows, snapshots };
}

/**
 * CLI Wrapper - Allows running the scanner from command line
 *
 * Usage examples:
 * - node runScan.js
 * - node runScan.js limit=50
 * - node runScan.js surfaces=google_ai,perplexity
 * - node runScan.js limit=10 concurrency=5
 *
 * Arguments:
 * - limit: Number of queries to process
 * - surfaces: Comma-separated list of AI platforms
 * - concurrency: Max parallel operations
 * - brand: Path to brand.json
 * - queries: Path to queries file
 */
if (require.main === module) {
  (async () => {
    // Parse command-line arguments (key=value format)
    const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));

    // Run scan with CLI arguments
    await runScan({
      limit: Number(args.limit ?? 20),
      surfaces: (args.surfaces?.split(',') as Surface[]) || undefined,
      concurrency: Number(args.concurrency ?? 2),
      brandPath: args.brand ?? 'data/brand.json',
      queriesPath: args.queries ?? 'data/queries-tagged.json',
      onProgress: (d, t) => process.stdout.write(`\rProgress ${d}/${t}`), // Show progress in terminal
    });

    console.log('\n✅ wrote data/report.json');
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
