import Kanban from './ui/Kanban';

async function fetchJSON(url: string) {
  return fetch(url, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => null);
}

export default async function ActionsPage() {
  const [recs, state] = await Promise.all([
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/actions`) ?? [],
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/actions/state`) ?? {},
  ]);
  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Recommendations</h1>
      <Kanban recs={recs} state={state} />
    </main>
  );
}
