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

  // Debug state changes
  useEffect(() => {
    console.log('STATE CHANGED - jobId:', jobId, 'state:', state, 'progress:', progress);
  }, [jobId, state, progress]);

  /**
   * start - Initiates a new scan job
   *
   * Sends POST request to /api/scan with scan parameters.
   * Updates state to show queued status and stores job ID for polling.
   */
  async function start() {
    try {
      // Force clear any existing job state and ensure clean start
      console.log('Starting new scan, force clearing all state');
      setJobId(null);
      setState('idle');
      setProgress(0);

      // Small delay to ensure state is cleared
      await new Promise((resolve) => setTimeout(resolve, 50));

      setState('queued');
      setProgress(0);

      // Get current project info from localStorage
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) {
        throw new Error('No project selected');
      }

      const project = JSON.parse(currentProject);
      console.log('Starting scan for project:', project.name, 'ID:', project.id);
      console.log('Full project data:', JSON.stringify(project, null, 2));

      const requestBody: Record<string, unknown> = {
        limit: 20,
        surfaces: 'google_ai,perplexity',
        projectId: project.id,
      };

      // Create brand configuration from project data
      let brandConfig = project.brand;

      // For existing projects that don't have brand object, create it from project fields
      if (!brandConfig && project.name) {
        brandConfig = {
          name: project.name,
          altSpellings: project.altSpellings || [],
          products: project.products || [],
          competitors: project.competitors || [],
        };
        console.log('Created brand config from project data:', brandConfig);
      }

      if (brandConfig) {
        requestBody.brand = brandConfig;
        console.log('Using brand config for scan:', brandConfig);
      }

      console.log('Full request body for scan:', JSON.stringify(requestBody, null, 2));

      // Trigger scan with brand configuration
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Scan request failed: ${res.status}`);
      }

      const data = await res.json();
      if (!data.jobId) {
        throw new Error('No job ID received from scan endpoint');
      }

      // Store job ID for status polling
      console.log('SETTING JOB ID:', data.jobId, 'for project:', project.name);
      setJobId(data.jobId);
      console.log('JOB ID SET - should trigger polling effect');
    } catch (error) {
      console.error('Failed to start scan:', error);
      setState('error');
      setProgress(0);
      setJobId(null);
    }
  }

  // Polling effect - THIS MUST WORK FOR RE-RUNS
  useEffect(() => {
    console.log('POLLING EFFECT TRIGGERED - jobId:', jobId);

    if (!jobId || jobId === null || jobId === undefined) {
      console.log('No valid jobId, exiting polling effect');
      return;
    }

    console.log('STARTING FRESH POLLING INTERVAL for job:', jobId);

    // Use a ref to track if we should continue polling
    let shouldPoll = true;

    const pollOnce = async () => {
      if (!shouldPoll) return;

      const url = '/api/scan/' + jobId;
      console.log('POLLING:', url);

      try {
        const res = await fetch(url);
        console.log('POLL RESPONSE STATUS:', res.status);

        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }

        const job = await res.json();
        console.log('JOB STATE:', job.state, 'PROGRESS:', job.progress);

        if (shouldPoll) {
          setProgress(Math.round((job.progress || 0) * 100));
          setState(job.state);

          if (job.state === 'done') {
            console.log('JOB DONE - RELOADING IN 500ms');
            shouldPoll = false;
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else if (job.state === 'error') {
            console.log('JOB ERROR');
            shouldPoll = false;
            setJobId(null);
            setState('idle');
          }
        }
      } catch (err) {
        console.error('POLL ERROR:', err);
        shouldPoll = false;
        setJobId(null);
        setState('idle');
      }
    };

    // Start polling immediately
    pollOnce();

    // Set up interval
    const intervalId = setInterval(pollOnce, 750);

    return () => {
      console.log('CLEANUP - STOPPING POLLING');
      shouldPoll = false;
      clearInterval(intervalId);
    };
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
