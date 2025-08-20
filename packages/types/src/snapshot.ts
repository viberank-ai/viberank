/**
 * Surface - AI search engine platforms that VibeRank monitors
 *
 * Each surface represents a different AI-powered search interface:
 * - google_ai: Google's AI Overview feature in search results
 * - chatgpt: OpenAI's ChatGPT with web browsing capabilities
 * - perplexity: Perplexity AI's search engine
 *
 * Referenced by:
 * - scraper/src/*: Each surface has its own scraper implementation
 * - pipeline/src/runScan.ts: Loads appropriate scraper based on surface
 * - web/app/dashboard/Heatmap.tsx: Displays results grouped by surface
 */
export type Surface = 'google_ai' | 'chatgpt' | 'perplexity';

/**
 * Snapshot - Raw scraped data from an AI search engine response
 *
 * Represents a single query result from one AI surface. This is the raw data
 * captured before any analysis is performed.
 *
 * Created by:
 * - pipeline/src/runScan.ts: scrapeOne() function creates snapshots
 * - web/app/api/scan/mock-scan.ts: Mock implementation for development
 *
 * Consumed by:
 * - pipeline/src/runScan.ts: analyzeOne() processes snapshots into AnalysisRows
 * - Stored in data/snapshots/*.json for historical analysis
 */
export interface Snapshot {
  /** Unique identifier for this snapshot (UUID format) */
  id: string;

  /** Which AI search engine this came from */
  surface: Surface;

  /** The search query that was submitted */
  query: string;

  /** ISO timestamp when the response was received */
  answeredAt: string;

  /** Raw HTML or markdown content of the AI's response
   * This is analyzed by presence.ts and sentiment.ts */
  answerHtml: string;

  /** URLs cited by the AI in its response
   * Used to determine if brand's website was referenced */
  citations: string[];

  /** Follow-up questions suggested by the AI (optional)
   * Can indicate topic relevance and user intent signals */
  followUps?: string[];
}

/**
 * AnalysisRow - Processed result from analyzing a snapshot
 *
 * This is the final analyzed data that appears in the dashboard heat-map.
 * Each row represents one cell in the query × surface matrix.
 *
 * Created by:
 * - pipeline/src/runScan.ts: analyzeOne() converts Snapshot → AnalysisRow
 * - web/app/api/report/route.ts: Analyzes golden samples into rows
 *
 * Consumed by:
 * - web/app/dashboard/Heatmap.tsx: Displays as color-coded cells
 * - data/report.json: Stored for dashboard retrieval
 */
export interface AnalysisRow {
  /** The search query that was analyzed */
  query: string;

  /** Which AI search engine this result is from */
  surface: Surface;

  /** Overall brand visibility score (0-100)
   * Calculated by analysis/src/score.ts based on presence, authority, and sentiment */
  score: number;

  /** Whether the brand was mentioned at all in the response
   * Detected by analysis/src/presence.ts using brand name/product matching */
  present: boolean;

  /** Whether the brand was cited as an authoritative source
   * True if brand's website appears in citations or is prominently featured */
  authority: boolean;
}
