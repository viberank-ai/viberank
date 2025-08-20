import { NextResponse } from 'next/server';
import { createJob, updateJob } from '../../../lib/jobs';
import { mockRunScan } from '../scan/mock-scan';
import fs from 'fs/promises';
import path from 'path';

interface ScanRequest {
  brand: {
    name: string;
    altSpellings: string[];
    products: string[];
    competitors: string[];
  };
  queries: string[];
  surfaces?: string;
  limit?: number;
}

export async function POST(req: Request) {
  try {
    const body: ScanRequest = await req.json();
    const { brand, queries, surfaces = 'google_ai,perplexity', limit = 20 } = body;

    if (!brand || !queries || queries.length === 0) {
      return NextResponse.json(
        { error: 'Brand configuration and queries are required' },
        { status: 400 }
      );
    }

    // Create job
    const job = createJob();

    // Run scan asynchronously
    (async () => {
      try {
        updateJob(job.id, { state: 'running' });

        // Use limited set of queries
        const queriesToRun = queries.slice(0, limit);
        const surfaceList = surfaces.split(',').filter(Boolean);

        // For now, use mock scan with the actual brand config
        const result = await mockRunScan({
          brand,
          queries: queriesToRun,
          surfaces: surfaceList as ('google_ai' | 'perplexity' | 'chatgpt')[],
          limit: queriesToRun.length,
          onProgress: (done, total) => {
            updateJob(job.id, { progress: done / total });
          },
        });

        // Save scan results for dashboard to display
        try {
          const dataDir = path.resolve(process.cwd(), '..', '..', 'data');
          await fs.mkdir(dataDir, { recursive: true });
          const scanResultsFile = path.join(dataDir, 'latest-scan-results.json');

          // Ensure result.rows exists and has data
          const rowsToSave = result.rows || [];

          await fs.writeFile(
            scanResultsFile,
            JSON.stringify(
              {
                brand,
                queries: queriesToRun,
                surfaces: surfaceList,
                rows: rowsToSave,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )
          );

          console.log(`Saved ${rowsToSave.length} scan results to:`, scanResultsFile);
        } catch (saveError) {
          console.error('Failed to save scan results:', saveError);
        }

        updateJob(job.id, {
          state: 'done',
          progress: 1,
          result,
        });
      } catch (error) {
        console.error('Scan failed:', error);
        updateJob(job.id, {
          state: 'error',
          error: error instanceof Error ? error.message : 'Scan failed',
        });
      }
    })();

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error('Failed to start scan:', error);
    return NextResponse.json({ error: 'Failed to start scan' }, { status: 500 });
  }
}
