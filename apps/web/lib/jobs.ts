/**
 * Jobs Library - In-memory job queue for async operations
 *
 * This module provides a simple in-memory job queue system for tracking
 * long-running operations like brand visibility scans. Jobs are stored
 * in memory (Map) and are not persisted across server restarts.
 *
 * Used by:
 * - app/api/scan/route.ts: Creates and updates scan jobs
 * - app/api/scan/[id]/route.ts: Retrieves job status
 *
 * Limitations:
 * - Jobs are lost on server restart
 * - No automatic cleanup (memory leak potential)
 * - Single-server only (doesn't scale horizontally)
 *
 * For production, consider:
 * - Redis/database persistence
 * - Job expiration/cleanup
 * - Distributed job queue (Bull, BullMQ, etc.)
 */

import crypto from 'node:crypto';

/**
 * JobState - Possible states in the job lifecycle
 * - queued: Job created but not started
 * - running: Job is actively processing
 * - done: Job completed successfully
 * - error: Job failed with an error
 */
export type JobState = 'queued' | 'running' | 'done' | 'error';

/**
 * Job - Generic job structure with progress tracking
 *
 * @template T - Type of the result data (e.g., scan results)
 */
export type Job<T = unknown> = {
  /** Unique job identifier (UUID) */
  id: string;

  /** Current job state */
  state: JobState;

  /** Progress percentage (0-1 scale) */
  progress: number;

  /** Timestamp when job was created (ms since epoch) */
  createdAt: number;

  /** Job result (available when state is 'done') */
  result?: T;

  /** Error message (available when state is 'error') */
  error?: string;
};

/**
 * In-memory job storage
 *
 * Uses a Map for O(1) lookups by job ID.
 * Note: This is cleared on server restart and has no size limits.
 * In production, implement job expiration to prevent memory leaks.
 */
const jobs = new Map<string, Job>();

// In development, jobs might get lost due to hot reloads
// Store them in a more persistent way
if (typeof global !== 'undefined') {
  // @ts-expect-error global property for dev persistence
  global.__viberank_jobs = global.__viberank_jobs || new Map();
  // Copy existing jobs from global storage
  // @ts-expect-error accessing global property
  for (const [id, job] of global.__viberank_jobs) {
    jobs.set(id, job);
  }
}

/**
 * createJob - Creates a new job in queued state
 *
 * Generates a unique UUID for the job and stores it in memory.
 * Jobs start in 'queued' state with 0% progress.
 *
 * @returns Newly created job object
 *
 * Called by:
 * - app/api/scan/route.ts: When initiating a new scan
 */
export function createJob(): Job {
  const id = crypto.randomUUID();
  const job: Job = {
    id,
    state: 'queued',
    progress: 0,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  // Also store in global for dev persistence
  if (typeof global !== 'undefined') {
    // @ts-expect-error global property for dev persistence
    global.__viberank_jobs = global.__viberank_jobs || new Map();
    // @ts-expect-error accessing global property
    global.__viberank_jobs.set(id, job);
  }
  console.log('Created job:', id, 'Total jobs:', jobs.size);
  return job;
}
/**
 * getJob - Retrieves a job by ID
 *
 * @param id - Job UUID
 * @returns Job object or null if not found
 *
 * Called by:
 * - app/api/scan/[id]/route.ts: For status polling
 */
export function getJob(id: string) {
  const job = jobs.get(id) || null;
  console.log('Getting job:', id, 'Found:', !!job, 'Total jobs:', jobs.size);
  return job;
}
/**
 * updateJob - Updates job properties
 *
 * Merges the provided patch into the existing job object.
 * Commonly used to update state, progress, and results.
 *
 * @param id - Job UUID
 * @param patch - Partial job object with properties to update
 *
 * Called by:
 * - app/api/scan/route.ts: Updates progress during scanning
 * - app/api/scan/route.ts: Sets final state and results
 */
export function updateJob<T>(id: string, patch: Partial<Job<T>>) {
  let j = jobs.get(id);

  // If not found in current map, try global storage (dev hot reload recovery)
  if (!j && typeof global !== 'undefined') {
    // @ts-expect-error accessing global property
    const globalJobs = global.__viberank_jobs;
    if (globalJobs) {
      j = globalJobs.get(id);
      if (j) {
        jobs.set(id, j); // Restore to current map
      }
    }
  }

  if (!j) {
    console.log('Cannot update job - not found:', id);
    return;
  }

  // Merge patch into existing job
  Object.assign(j, patch);

  // Re-set to ensure Map updates
  jobs.set(id, j);
  // Also update global storage
  if (typeof global !== 'undefined') {
    // @ts-expect-error global property for dev persistence
    global.__viberank_jobs = global.__viberank_jobs || new Map();
    // @ts-expect-error accessing global property
    global.__viberank_jobs.set(id, j);
  }
  console.log('Updated job:', id, 'New state:', j.state, 'Progress:', j.progress);
}
