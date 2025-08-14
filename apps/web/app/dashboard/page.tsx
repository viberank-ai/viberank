import Heatmap from './Heatmap';

type Row = { query: string; surface: string; score: number; present: boolean; authority: boolean };

export const dynamic = 'force-dynamic'; // always fetch fresh server data

export default async function Dashboard() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/report`, {
    cache: 'no-store',
  }).catch(() => null);
  const data = (await res?.json().catch(() => ({ rows: [] as Row[] }))) ?? { rows: [] as Row[] };
  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Coverage heat‑map</h1>
      <Heatmap rows={data.rows} />
    </main>
  );
}
