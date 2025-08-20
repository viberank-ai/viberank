import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { detectPresence } from '../../../../../packages/analysis/src/presence';
import { classify } from '../../../../../packages/analysis/src/sentiment';
import { calcScore } from '../../../../../packages/analysis/src/score';
import { htmlToText } from 'html-to-text';

// Force deterministic sentiment analysis (no LLM) for consistent results
process.env.ANALYSIS_DISABLE_LLM = process.env.ANALYSIS_DISABLE_LLM ?? '1';

interface Row {
  query: string;
  surface: string;
  score: number;
  present: boolean;
  authority: boolean;
}

interface Sample {
  query: string;
  surface: string;
  html: string;
  brand: { name: string; altSpellings: string[] };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // Get project ID from query params
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  try {
    // Try to get project-specific scan results
    const dataDir = path.resolve(process.cwd(), '..', '..', 'data');

    if (projectId) {
      // Try project-specific file first
      const projectScanFile = path.join(dataDir, `scan-results-${projectId}.json`);
      console.log('Looking for project scan results at:', projectScanFile);

      try {
        const scanResults = await fs.readFile(projectScanFile, 'utf-8');
        const { rows, brand, timestamp, queries, surfaces } = JSON.parse(scanResults);
        console.log(
          'Found project scan results:',
          rows?.length,
          'rows from file:',
          projectScanFile
        );
        if (rows && rows.length > 0) {
          return NextResponse.json({
            rows,
            source: 'scan',
            timestamp: timestamp || new Date().toISOString(),
            brand,
            queries,
            surfaces,
          });
        }
      } catch {
        console.log('No project scan results found for project:', projectId);
      }
    }

    // Fall back to legacy global file for backward compatibility
    const scanResultsFile = path.join(dataDir, 'latest-scan-results.json');

    try {
      const scanResults = await fs.readFile(scanResultsFile, 'utf-8');
      const { rows, brand, timestamp, queries, surfaces } = JSON.parse(scanResults);
      console.log('Found legacy scan results:', rows?.length, 'rows');
      if (rows && rows.length > 0) {
        return NextResponse.json({
          rows,
          source: 'scan',
          timestamp: timestamp || new Date().toISOString(),
          brand,
          queries,
          surfaces,
        });
      }
    } catch {
      console.log('No scan results found');
      // No scan results available, fall back to golden samples
    }

    // Fallback to golden samples
    const root = path.resolve(process.cwd(), '..', '..');
    const file = path.join(root, 'packages', 'eval', 'golden', 'samples.json');

    const raw = await fs.readFile(file, 'utf-8');
    const samples: Sample[] = JSON.parse(raw);

    const rows: Row[] = [];
    for (const s of samples) {
      const { present, authority } = detectPresence(s.html, s.brand);
      const text = htmlToText(s.html, { wordwrap: false });
      const sent = await classify(text);
      const breakdown = calcScore({ present, authority, polarity: sent.polarity });

      rows.push({
        query: s.query,
        surface: s.surface,
        score: breakdown.score,
        present,
        authority,
      });
    }

    return NextResponse.json({
      rows,
      source: 'golden-samples',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch latest results:', error);
    return NextResponse.json(
      {
        rows: [],
        source: 'error',
        error: 'Failed to load data',
      },
      { status: 500 }
    );
  }
}
