'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const PROJECTS = [{ id: 'default', name: 'Default Project' }];

export default function TopNav() {
  const [project, setProject] = useState('default');
  useEffect(() => {
    const saved = window.localStorage.getItem('viberank.project');
    if (saved) setProject(saved);
  }, []);
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setProject(id);
    window.localStorage.setItem('viberank.project', id);
  }
  return (
    <nav className="sticky top-0 z-10 backdrop-blur bg-slate-950/60 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold">
          VibeRank
        </Link>
        <Link href="/dashboard" className="opacity-80 hover:opacity-100">
          Dashboard
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <label className="opacity-70 text-sm">Project</label>
          <select
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={project}
            onChange={onChange}
          >
            {PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
