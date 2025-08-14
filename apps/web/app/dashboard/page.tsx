import Heatmap from './Heatmap';
import RunScan from './RunScan';

export const dynamic = 'force-dynamic';

type Row = { query: string; surface: string; score: number; present: boolean; authority: boolean };

async function fetchRows(): Promise<Row[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/report`, {
    cache: 'no-store',
  }).catch(() => null);
  return (
    (await res
      ?.json()
      .then((d) => d.rows as Row[])
      .catch(() => [])) ?? []
  );
}

export default async function Dashboard() {
  const rows = await fetchRows();
  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Coverage heat-map</h1>
        <RunScan />
      </div>
      <Heatmap rows={rows} />
    </main>
  );
}
