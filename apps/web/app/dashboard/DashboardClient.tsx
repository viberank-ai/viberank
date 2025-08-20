'use client';

import { useEffect, useState } from 'react';
import Heatmap from './Heatmap';
import RunScan from './RunScan';
import ShareButton from './ShareButton';

type Row = {
  query: string;
  surface: string;
  score: number;
  present: boolean;
  authority: boolean;
};

interface DataResponse {
  rows: Row[];
  source: 'scan' | 'golden-samples' | 'error';
  timestamp: string;
  brand?: { name: string };
  error?: string;
}

export default function DashboardClient() {
  const [data, setData] = useState<DataResponse>({
    rows: [],
    source: 'error',
    timestamp: new Date().toISOString(),
    error: 'Loading...',
  });
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Get current project from localStorage
      const currentProject = localStorage.getItem('currentProject');
      let projectId = '';

      if (currentProject) {
        const project = JSON.parse(currentProject);
        projectId = project.id;
        setProjectName(project.name);
      } else {
        // No project selected - show error
        setData({
          rows: [],
          source: 'error',
          timestamp: new Date().toISOString(),
          error: 'No project selected',
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch project-specific results - always use projectId
        const url = `/api/latest-results?projectId=${projectId}`;

        const res = await fetch(url);
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        } else {
          setData({
            rows: [],
            source: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to load data',
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setData({
          rows: [],
          source: 'error',
          timestamp: new Date().toISOString(),
          error: 'Failed to load data',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []); // Run once on mount

  if (loading) {
    return (
      <main>
        <div className="flex items-center justify-center p-8">
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
              title="Back to projects"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </a>
            <h1 className="text-2xl font-semibold">Coverage heat-map</h1>
          </div>
          {data.source === 'scan' ? (
            <>
              <p className="text-sm text-green-400 mt-1">Showing results from your latest scan</p>
              {data.brand && <p className="text-xs text-slate-400">Brand: {data.brand.name}</p>}
            </>
          ) : data.source === 'golden-samples' ? (
            <p className="text-sm text-yellow-400 mt-1">
              Showing demo data - configure your brand and run a scan to see real results
            </p>
          ) : data.source === 'error' && projectName ? (
            <p className="text-sm text-slate-400 mt-1">
              No scan results yet for {projectName} - click "Run Live GEO Check" to start
            </p>
          ) : (
            <p className="text-sm text-red-400 mt-1">{data.error || 'Error loading data'}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a href="/setup" className="text-blue-400 hover:text-blue-300 text-sm underline">
            Configure Brand
          </a>
          <ShareButton />
          <RunScan />
        </div>
      </div>

      <Heatmap rows={data.rows} />

      <div className="mt-4 text-xs text-slate-500 flex justify-between">
        <span>
          Data source: {data.source} • Last updated: {new Date(data.timestamp).toLocaleString()}
        </span>
        {data.rows.length > 0 && <span>{data.rows.length} results</span>}
      </div>
    </main>
  );
}
