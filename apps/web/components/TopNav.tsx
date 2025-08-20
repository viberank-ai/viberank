'use client';

import Link from 'next/link';

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-10 backdrop-blur bg-slate-950/60 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold text-xl">
          VibeRank
        </Link>
        <div className="ml-auto">
          <span className="text-slate-400 text-sm">AI Search Engine Brand Monitoring</span>
        </div>
      </div>
    </nav>
  );
}
