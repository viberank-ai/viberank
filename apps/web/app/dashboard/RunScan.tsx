/**
 * RunScan Component - Triggers and monitors brand visibility scans
 *
 * This client component provides the "Run Live GEO Check" button that
 * initiates on-demand scanning of AI search engines. It manages the
 * entire scan lifecycle:
 *
 * 1. User clicks button → POST to /api/scan
 * 2. Receives job ID → Starts polling for progress
 * 3. Shows progress bar → Updates every 1.5 seconds
 * 4. Scan completes → Refreshes page to show new data
 *
 * Features:
 * - Visual progress bar during scanning
 * - Disabled state while scan is running
 * - Auto-refresh on completion
 * - Error handling for failed scans
 *
 * Used by:
 * - app/dashboard/page.tsx: Placed in dashboard header
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * RunScan - Button component for triggering live scans
 *
 * Manages the complete scan workflow from initiation to completion.
 * Uses React hooks for state management and polling.
 *
 * @returns Button with progress bar (when active)
 */
export default function RunScan() {
  // Job ID returned from POST /api/scan
  const [jobId, setJobId] = useState<string | null>(null);

  // Progress percentage (0-100) for progress bar
  const [progress, setProgress] = useState(0);

  // Current job state for UI updates
  const [state, setState] = useState<'idle' | 'queued' | 'running' | 'done' | 'error'>('idle');

  /**
   * start - Initiates a new scan job
   *
   * Sends POST request to /api/scan with scan parameters.
   * Updates state to show queued status and stores job ID for polling.
   */
  async function start() {
    // Update UI to show scan is starting
    setState('queued');
    setProgress(0);

    // Trigger scan with default parameters
    const res = await fetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({
        limit: 20, // Process 20 queries (uses default surfaces from API)
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    // Store job ID for status polling
    const { jobId } = await res.json();
    setJobId(jobId);
  }

  /**
   * Polling effect - Monitors job progress
   *
   * Sets up an interval to poll GET /api/scan/[id] every 1.5 seconds.
   * Updates progress bar and state based on job status.
   * Refreshes page when scan completes to show new data.
   */
  useEffect(() => {
    if (!jobId) return; // No job to monitor

    // Set up polling interval
    const t = setInterval(async () => {
      // Fetch current job status
      const r = await fetch('/api/scan/' + jobId).then((r) => r.json());

      // Update UI with latest progress
      setProgress(Math.round((r.progress || 0) * 100)); // Convert 0-1 to 0-100
      setState(r.state);

      // Check if job is complete
      if (r.state === 'done' || r.state === 'error') {
        clearInterval(t); // Stop polling
        location.reload(); // Refresh page to show new data in heat-map
      }
    }, 1500); // Poll every 1.5 seconds

    // Cleanup interval on unmount or job change
    return () => clearInterval(t);
  }, [jobId]);

  return (
    <div className="flex items-center gap-3">
      {/* Scan trigger button */}
      <button
        onClick={start}
        disabled={state === 'queued' || state === 'running'} // Disable during scan
        className="bg-emerald-500 hover:bg-emerald-600 text-black rounded px-3 py-1.5"
      >
        {state === 'running' ? 'Scanning…' : 'Run Live GEO Check'}
      </button>

      {/* Progress bar (only visible during scan) */}
      {(state === 'queued' || state === 'running') && (
        <div className="min-w-[160px] h-2 bg-slate-800 rounded overflow-hidden">
          {/* Animated progress fill */}
          <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
