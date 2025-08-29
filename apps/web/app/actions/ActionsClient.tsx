'use client';

import { useEffect, useState } from 'react';
import Kanban from './ui/Kanban';

type Rec = {
  id: string;
  type: string;
  title: string;
  description: string;
  ice: number;
  effort: number;
  related: string[];
  source?: {
    query: string;
    surface: string;
    score: number;
    present: boolean;
  };
};

type State = Record<string, { status: 'Backlog' | 'Doing' | 'Done'; note?: string }>;

export default function ActionsClient() {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [state, setState] = useState<State>({});
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Get current project from localStorage
      const currentProject = localStorage.getItem('currentProject');
      if (!currentProject) {
        setLoading(false);
        return;
      }

      const project = JSON.parse(currentProject);
      const projectId = project.id;
      setProjectName(project.name);

      try {
        // Fetch project-specific actions and state
        const [recsRes, stateRes] = await Promise.all([
          fetch(`/api/actions?projectId=${projectId}`),
          fetch(`/api/actions/state?projectId=${projectId}`)
        ]);

        if (recsRes.ok) {
          const recsData = await recsRes.json();
          setRecs(recsData);
        }

        if (stateRes.ok) {
          const stateData = await stateRes.json();
          setState(stateData);
        }
      } catch (error) {
        console.error('Failed to load actions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <main>
        <div className="flex items-center justify-center p-8">
          <p className="text-slate-400">Loading actions...</p>
        </div>
      </main>
    );
  }

  if (!projectName) {
    return (
      <main>
        <div className="flex items-center justify-center p-8">
          <p className="text-slate-400">No project selected. <a href="/" className="text-blue-400 underline">Select a project</a></p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-slate-400 hover:text-white transition-colors"
            title="Back to dashboard"
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
          <h1 className="text-2xl font-semibold">Action Items</h1>
          <span className="text-sm text-slate-400">({projectName})</span>
        </div>
        <div className="text-sm text-slate-400">
          💡 Click <span className="text-blue-400">+</span> on red heatmap cells to generate actions
        </div>
      </div>
      <Kanban recs={recs} state={state} />
    </main>
  );
}