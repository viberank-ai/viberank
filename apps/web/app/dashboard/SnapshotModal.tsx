'use client';

import { useEffect, useState } from 'react';

type Props = { query: string; surface: string; onClose: () => void };
type Payload = {
  answeredAt: string;
  answerHtml: string;
  citations: string[];
  metrics: { score: number; present: boolean; authority: boolean; polarity: number };
};

export default function SnapshotModal({ query, surface, onClose }: Props) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `/api/snapshot?query=${encodeURIComponent(query)}&surface=${encodeURIComponent(surface)}`
        );
        if (!r.ok) throw new Error(await r.text());
        setData(await r.json());
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Failed to load');
      }
    })();
  }, [query, surface]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto max-w-3xl bg-slate-950 border border-slate-800 rounded shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70">{surface}</div>
            <div className="font-semibold">{query}</div>
          </div>
          <button className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {!data && !error && <div>Loading…</div>}
          {error && <div className="text-red-400">{error}</div>}
          {data && (
            <>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="opacity-70">Score</span>
                  <div className="text-xl">{data.metrics.score}</div>
                </div>
                <div>
                  <span className="opacity-70">Present</span>
                  <div>{data.metrics.present ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <span className="opacity-70">Authority</span>
                  <div>{data.metrics.authority ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <span className="opacity-70">Polarity</span>
                  <div>{data.metrics.polarity.toFixed(2)}</div>
                </div>
                <div className="ml-auto">
                  <span className="opacity-70">Captured</span>
                  <div>{new Date(data.answeredAt).toLocaleString()}</div>
                </div>
              </div>

              <section>
                <h3 className="font-medium mb-2">Answer</h3>
                <article
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.answerHtml }}
                />
              </section>

              {data.citations?.length > 0 && (
                <section>
                  <h3 className="font-medium mb-2">Citations</h3>
                  <ul className="list-disc ml-5 space-y-1">
                    {data.citations.map((c, i) => (
                      <li key={i}>
                        <a className="underline" href={c} target="_blank" rel="noreferrer">
                          {c}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
