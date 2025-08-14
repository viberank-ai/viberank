/**
 * Scan Status API Route - Retrieves job status and results
 *
 * This endpoint allows clients to poll for the status of a scan job
 * initiated via POST /api/scan. It returns the current state, progress,
 * and results (when complete) of the specified job.
 *
 * Job states:\n * - queued: Job created but not started
 * - running: Actively scraping/analyzing
 * - done: Completed successfully with results
 * - error: Failed with error message
 *
 * Used by:
 * - app/dashboard/RunScan.tsx: Polls every 1.5s for progress updates
 */

import { NextResponse } from 'next/server';
import { getJob } from '../../../../lib/jobs';

/**
 * GET /api/scan/[id] - Retrieves job status and results
 *
 * @param _ - Request object (unused)
 * @param params - Route parameters containing job ID
 * @returns JSON with job details or 404 if job not found
 *
 * Response includes:
 * - id: Job identifier
 * - state: Current job state
 * - progress: Completion percentage (0-1)
 * - createdAt: Timestamp when job was created
 * - result: Scan results (when state is 'done')
 * - error: Error message (when state is 'error')
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  // Look up job in the in-memory store
  const job = getJob(params.id);

  // Return 404 if job doesn't exist or has expired
  if (!job) return new NextResponse('Not found', { status: 404 });

  // Return full job details for client polling
  return NextResponse.json(job);
}
