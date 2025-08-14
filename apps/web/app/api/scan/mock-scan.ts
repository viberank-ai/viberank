import { AnalysisRow, Snapshot, Surface } from '../../../../../packages/types/src/snapshot';

// Mock implementation for development when scrapers can't load
export async function mockRunScan(opts: {
  limit: number;
  surfaces: Surface[];
  onProgress: (done: number, total: number) => void;
}): Promise<{ rows: AnalysisRow[]; snapshots: Snapshot[] }> {
  const { limit, surfaces, onProgress } = opts;

  const mockQueries = [
    'best headphones 2024',
    'wireless earbuds review',
    'noise cancelling headphones',
    'gaming headset recommendation',
    'audiophile headphones under $200',
  ].slice(0, limit);

  const snapshots: Snapshot[] = [];
  const rows: AnalysisRow[] = [];

  const total = mockQueries.length * surfaces.length;
  let done = 0;

  for (const query of mockQueries) {
    for (const surface of surfaces) {
      // Simulate some delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const mockSnapshot: Snapshot = {
        id: `mock-${Date.now()}-${Math.random()}`,
        surface,
        query,
        answeredAt: new Date().toISOString(),
        answerHtml: `<div>Mock response for "${query}" from ${surface}. This is simulated data for development.</div>`,
        citations: [`https://mock-${surface}.example.com`],
        followUps: [`More about ${query}?`],
      };

      const mockRow: AnalysisRow = {
        query,
        surface,
        score: Math.floor(Math.random() * 100),
        present: Math.random() > 0.3,
        authority: Math.random() > 0.7,
      };

      snapshots.push(mockSnapshot);
      rows.push(mockRow);

      done++;
      onProgress(done, total);
    }
  }

  return { rows, snapshots };
}
