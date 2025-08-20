'use client';
import { useState } from 'react';

export default function ShareButton() {
  const [url, setUrl] = useState<string | null>(null);
  async function create() {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 7 }),
    });
    const { url } = await res.json();
    setUrl(url);
  }
  return (
    <div className="flex items-center gap-3">
      <button onClick={create} className="bg-slate-800 hover:bg-slate-700 rounded px-3 py-1">
        Create share link
      </button>
      {url && (
        <a className="underline" href={url} target="_blank" rel="noreferrer">
          Open shared view
        </a>
      )}
    </div>
  );
}
