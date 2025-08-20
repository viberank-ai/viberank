import Heatmap from '../dashboard/Heatmap';

export default function TestHeatmap() {
  // Test data matching the actual API response
  const testRows = [
    {
      query: 'What is VibeRank?',
      surface: 'google_ai',
      score: 69,
      present: true,
      authority: true,
    },
    {
      query: 'Is VibeRank a scam?',
      surface: 'chatgpt',
      score: 21,
      present: true,
      authority: false,
    },
    {
      query: 'What is VibeRank?',
      surface: 'chatgpt',
      score: 85,
      present: true,
      authority: true,
    },
    {
      query: 'Is VibeRank a scam?',
      surface: 'google_ai',
      score: 45,
      present: true,
      authority: false,
    },
    {
      query: 'VibeRank alternatives',
      surface: 'perplexity',
      score: 30,
      present: true,
      authority: false,
    },
  ];

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Heatmap Test</h1>
      <div className="mb-4 p-4 bg-slate-800 rounded">
        <p className="text-sm">Test data: {testRows.length} rows</p>
        <p className="text-sm">
          Surfaces: {Array.from(new Set(testRows.map((r) => r.surface))).join(', ')}
        </p>
        <p className="text-sm">
          Queries: {Array.from(new Set(testRows.map((r) => r.query))).join(', ')}
        </p>
      </div>
      <Heatmap rows={testRows} />
    </main>
  );
}
