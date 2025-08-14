import { NextResponse } from 'next/server';
import { createJob, updateJob } from '../../../lib/jobs';
import { runScan } from '../../../../../packages/pipeline/src/runScan';
import { Surface } from '../../../../../packages/types/src/snapshot';

interface ScanRequestBody {
  limit?: number;
  surfaces?: string;
  concurrency?: number;
}

export async function POST(req: Request) {
  const body = await req.json().catch((): ScanRequestBody => ({}));
  const {
    limit = 20,
    surfaces = 'google_ai,bing_copilot,perplexity',
    concurrency = 2,
  } = body || {};
  const job = createJob();

  // Kick off without awaiting
  (async () => {
    try {
      updateJob(job.id, { state: 'running' });
      const s = (surfaces as string).split(',').filter(Boolean) as Surface[];
      const res = await runScan({
        limit: Number(limit),
        surfaces: s,
        concurrency: Number(concurrency),
        onProgress: (d, t) => updateJob(job.id, { progress: d / t }),
        writeArtifacts: true,
      });
      updateJob(job.id, { state: 'done', progress: 1, result: res });
    } catch (e) {
      updateJob(job.id, {
        state: 'error',
        error: e instanceof Error ? e.message : 'unknown error',
      });
    }
  })();

  return NextResponse.json({ jobId: job.id });
}
