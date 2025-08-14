'use client';

import { useEffect, useState } from 'react';

export default function RunScan() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'idle' | 'queued' | 'running' | 'done' | 'error'>('idle');

  async function start() {
    setState('queued');
    setProgress(0);
    const res = await fetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ limit: 20 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const { jobId } = await res.json();
    setJobId(jobId);
  }

  useEffect(() => {
    if (!jobId) return;
    const t = setInterval(async () => {
      const r = await fetch('/api/scan/' + jobId).then((r) => r.json());
      setProgress(Math.round((r.progress || 0) * 100));
      setState(r.state);
      if (r.state === 'done' || r.state === 'error') {
        clearInterval(t);
        // refresh page data
        location.reload();
      }
    }, 1500);
    return () => clearInterval(t);
  }, [jobId]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={start}
        disabled={state === 'queued' || state === 'running'}
        className="bg-emerald-500 hover:bg-emerald-600 text-black rounded px-3 py-1.5"
      >
        {state === 'running' ? 'Scanning…' : 'Run Live GEO Check'}
      </button>
      {(state === 'queued' || state === 'running') && (
        <div className="min-w-[160px] h-2 bg-slate-800 rounded overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
