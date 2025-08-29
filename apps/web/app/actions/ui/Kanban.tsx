'use client';

import { useEffect, useState } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const COLS = ['Backlog', 'Doing', 'Done'] as const;

function Card({ rec, id, highlighted }: { rec: Rec; id: string; highlighted?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const borderClass = highlighted ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700';
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-slate-900 border ${borderClass} rounded p-3 mb-2 transition-all`}
    >
      <div className="text-sm opacity-70">{rec.type}</div>
      <div className="font-medium">{rec.title}</div>
      {rec.source && (
        <div className="text-xs text-blue-400 mt-1 bg-slate-800 rounded px-2 py-1">
          📊 {rec.source.query} on {rec.source.surface} (score: {rec.source.score})
        </div>
      )}
      <div className="text-xs opacity-70 mt-1">
        ICE {rec.ice} • Effort {rec.effort}
      </div>
      {highlighted && (
        <div className="text-xs text-blue-400 mt-1 font-medium">
          🎯 Generated from heatmap
        </div>
      )}
    </div>
  );
}

export default function Kanban({ recs, state }: { recs: Rec[]; state: State }) {
  const byCol: Record<(typeof COLS)[number], string[]> = { Backlog: [], Doing: [], Done: [] };
  const map = new Map<string, Rec>();
  for (const r of recs) {
    map.set(r.id, r);
    const s = state[r.id]?.status || 'Backlog';
    byCol[s].push(r.id);
  }
  const [columns, setColumns] = useState(byCol);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Check for highlight parameter
  const highlightId = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('highlight')
    : null;

  useEffect(() => {
    setColumns(byCol);
  }, [recs.length]);

  async function save(newCols: typeof columns) {
    const out: State = {};
    for (const c of COLS) for (const id of newCols[c]) out[id] = { status: c };
    
    // Get project ID from localStorage
    const currentProject = localStorage.getItem('currentProject');
    if (!currentProject) return;
    const projectId = JSON.parse(currentProject).id;
    
    await fetch(`/api/actions/state?projectId=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(out),
    });
  }

  function onDragEnd(e: { active: { id: string }; over: { id: string } | null }) {
    const { active, over } = e;
    if (!over) return;
    const from = COLS.find((c) => columns[c].includes(active.id));
    const to = COLS.find((c) => c === over.id || columns[c].includes(over.id));
    if (!from || !to) return;

    if (from === to) {
      const idxFrom = columns[from].indexOf(active.id);
      const idxTo = columns[from].indexOf(over.id);
      const newCol = arrayMove(columns[from], idxFrom, idxTo);
      const next = { ...columns, [from]: newCol };
      setColumns(next);
      save(next);
    } else {
      const fromArr = [...columns[from]].filter((x) => x !== active.id);
      const toArr = [...columns[to]];
      const insertAt = columns[to].indexOf(over.id);
      toArr.splice(insertAt === -1 ? toArr.length : insertAt, 0, active.id);
      const next = { ...columns, [from]: fromArr, [to]: toArr };
      setColumns(next);
      save(next);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {COLS.map((col) => (
          <div key={col} className="bg-slate-950 border border-slate-800 rounded p-3">
            <div className="font-medium mb-2">{col}</div>
            <SortableContext items={columns[col]} strategy={verticalListSortingStrategy}>
              {columns[col].map((id) => {
                const rec = map.get(id)!;
                const isHighlighted = highlightId && rec.source && 
                  `${rec.source.query}:${rec.source.surface}` === highlightId;
                return (
                  <Card key={id} id={id} rec={rec} highlighted={isHighlighted} />
                );
              })}
            </SortableContext>
          </div>
        ))}
      </DndContext>
    </div>
  );
}
