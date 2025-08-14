import { NextResponse } from 'next/server';
import { createJob, updateJob } from '../../../lib/jobs';
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

      // Dynamic import to avoid pulling in scraper dependencies at module level
      const { runScan } = await import('../../../../../packages/pipeline/src/runScan');

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
      console.error('Scan failed:', e);
      updateJob(job.id, {
        state: 'error',
        error:
          e instanceof Error
            ? e.message
            : 'Scan failed - scraping modules may not be available in this environment',
      });
    }
  })();

  return NextResponse.json({ jobId: job.id });
}
