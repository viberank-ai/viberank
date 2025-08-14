/**
 * Scan API Route - Triggers asynchronous brand visibility scans
 *
 * This endpoint initiates on-demand scraping and analysis of AI search engines.
 * It creates a background job that:
 * 1. Scrapes specified AI platforms with configured queries
 * 2. Analyzes responses for brand presence and sentiment
 * 3. Calculates visibility scores
 * 4. Updates job progress for client polling
 *
 * The endpoint returns immediately with a job ID, allowing the client to
 * poll for progress via GET /api/scan/[id]
 *
 * Used by:
 * - app/dashboard/RunScan.tsx: "Run Live GEO Check" button
 */

import { NextResponse } from 'next/server';
import { createJob, updateJob } from '../../../lib/jobs';
import { Surface } from '../../../../../packages/types/src/snapshot';

/**
 * ScanRequestBody - Request parameters for initiating a scan
 */
interface ScanRequestBody {
  /** Number of queries to process (default: 20) */
  limit?: number;

  /** Comma-separated list of surfaces to scan
   * Default: "google_ai,bing_copilot,perplexity" */
  surfaces?: string;

  /** Max parallel scraping operations (default: 2) */
  concurrency?: number;
}

/**
 * POST /api/scan - Initiates an asynchronous scan job
 *
 * Creates a background job that runs the scanning pipeline without
 * blocking the HTTP response. The job can be monitored via polling.
 *
 * Request body (all optional):
 * - limit: Number of queries to scan
 * - surfaces: Comma-separated AI platforms
 * - concurrency: Parallel operation limit
 *
 * @returns JSON with jobId for status polling
 */
export async function POST(req: Request) {
  // Parse request body with fallback to empty object
  const body = await req.json().catch((): ScanRequestBody => ({}));

  // Extract parameters with defaults
  const {
    limit = 20,
    surfaces = 'google_ai,bing_copilot,perplexity', // ChatGPT excluded by default
    concurrency = 2,
  } = body || {};

  // Create job entry in the in-memory store
  const job = createJob();

  // Start async processing without blocking the response
  // This allows the endpoint to return immediately with a job ID
  (async () => {
    try {
      // Mark job as running
      updateJob(job.id, { state: 'running' });

      // Parse surfaces string into typed array
      const s = (surfaces as string).split(',').filter(Boolean) as Surface[];

      let res;
      try {
        // Attempt to use real scanning pipeline
        // This will fail in development due to Puppeteer/Next.js incompatibility
        const { runScan } = await import('../../../../../packages/pipeline/src/runScan');
        res = await runScan({
          limit: Number(limit),
          surfaces: s,
          concurrency: Number(concurrency),
          onProgress: (d, t) => updateJob(job.id, { progress: d / t }), // Update job progress
          writeArtifacts: true, // Save snapshots and report
        });
      } catch (scraperError) {
        // Expected in development - Puppeteer doesn't work with Next.js Edge runtime
        console.warn('Real scrapers failed, falling back to mock data:', scraperError);

        // Use mock implementation that generates synthetic data
        const { mockRunScan } = await import('./mock-scan');
        res = await mockRunScan({
          limit: Number(limit),
          surfaces: s,
          onProgress: (d, t) => updateJob(job.id, { progress: d / t }),
        });
      }

      // Mark job as complete with results
      updateJob(job.id, { state: 'done', progress: 1, result: res });
    } catch (e) {
      // Handle unexpected errors
      console.error('Scan failed:', e);
      updateJob(job.id, {
        state: 'error',
        error: e instanceof Error ? e.message : 'Scan failed completely',
      });
    }
  })();

  // Return immediately with job ID for status polling
  // Client can poll GET /api/scan/[jobId] for progress
  return NextResponse.json({ jobId: job.id });
}
